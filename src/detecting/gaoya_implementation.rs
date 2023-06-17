/*
*   Copyright (c) 2023 Duart Snel
*   All rights reserved.

*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at

*   http://www.apache.org/licenses/LICENSE-2.0

*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*/

pub mod gaoya_implementation {
    use std::{fs::File, hash::BuildHasherDefault, io::Read};

    use gaoya::{
        minhash::{MinHashIndex, MinHasher, MinHasher32},
        text::shingle_text,
    };

    use crate::{detecting::detecting::DiskData, LicenseListActions, LicenseMatch};

    // #[derive(Serialize, Deserialize, Debug, Clone)]
    // /// How the contents of the JSON db looks like, used for parsing purposes.
    // struct _GaoyaComputedLicense {
    //     name: String,
    //     hash: Vec<u32>,
    // }

    pub struct GaoyaDetection {
        pub index: MinHashIndex<u32, String>,
        pub min_hasher: MinHasher32<BuildHasherDefault<fnv::FnvHasher>>,
        pub shingle_text_size: usize,

        pub normalization_fn: fn(&str) -> String,
    }
    impl LicenseListActions<Vec<u32>> for GaoyaDetection {
        fn match_by_plain_text(&self, plain_text: &str) -> Vec<LicenseMatch> {
            let signature = self.min_hasher.create_signature(shingle_text(
                &(self.normalization_fn)(plain_text),
                self.shingle_text_size,
            ));
            let res = self.index.query_owned_return_similarity(&signature);
            let mut matches: Vec<LicenseMatch> = Vec::new();
            // TODO: simd? maybe it already does it?
            for (name, conf) in res {
                matches.push(LicenseMatch {
                    name,
                    confidence: conf as f32 * 100.0,
                });
            }
            matches
        }

        fn match_by_hash(&self, hash: Vec<u32>) -> Vec<LicenseMatch> {
            let res = self.index.query_owned_return_similarity(&hash);
            let mut matches: Vec<LicenseMatch> = Vec::new();
            // TODO: simd? maybe it already does it?
            for (name, conf) in res {
                matches.push(LicenseMatch {
                    name,
                    confidence: conf as f32 * 100.0,
                });
            }
            matches
        }

        fn get_license_list(&self) -> Vec<(String, Vec<u32>)> {
            self.index
                .get_id_signature_map()
                .iter()
                .map(|(name, hash)| (name.clone(), hash.clone()))
                .collect()
        }

        fn load_from_file(&mut self, file_path: &str) {
            let mut file = File::open(file_path).unwrap();
            let mut contents = Vec::new();
            file.read_to_end(&mut contents).unwrap();

            self.load_from_memory(&contents);
        }

        fn load_from_memory(&mut self, raw: &Vec<u8>) {
            let decoded: DiskData<Vec<u32>> = bincode::deserialize(&raw[..]).unwrap_or(DiskData {
                licenses: Vec::new(),
            });
            for l in decoded.licenses {
                self.index.insert(l.name, l.hash);
            }
        }

        fn add_plain(&mut self, license_name: &str, license_text: &str) {
            let signature = self.min_hasher.create_signature(shingle_text(
                &(self.normalization_fn)(license_text),
                self.shingle_text_size,
            ));
            self.index.insert(license_name.to_string(), signature);
        }

        fn hash_from_inline_string(&self, license_text: &str) -> Vec<u32> {
            self.min_hasher.create_signature(shingle_text(
                &(self.normalization_fn)(license_text),
                self.shingle_text_size,
            ))
        }

        fn remove(&mut self, license_name: &str) {
            self.index.remove(&license_name.to_string());
        }

        fn set_normalization_fn(&mut self, func: fn(&str) -> String) {
            self.normalization_fn = func;
        }
    }
}
