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
// TODO: implement Gaoya simhash variant.
pub mod gaoya_implementation {
    use std::{
        fs::File,
        hash::BuildHasherDefault,
        io::{Read, Write},
    };

    use gaoya::{
        minhash::{MinHashIndex, MinHasher, MinHasher32},
        text::shingle_text,
    };
    use serde::{Deserialize, Serialize};

    use crate::{
        strip_license, strip_spdx_heading, LicenseListActions, LicenseMatch,
    };

    #[derive(Serialize, Deserialize, Debug, Clone)]
    /// How the contents of the JSON db looks like, used for parsing purposes.
    struct _GaoyaComputedLicense {
        name: String,
        hash: Vec<u32>,
    }

    #[derive(Serialize, Deserialize, Debug, Clone)]
    /// How the contents of the JSON db looks like, used for parsing purposes.
    struct _Raw {
        //TODO: make this universal so that we can use it for all implementations.
        pub licenses: Vec<_GaoyaComputedLicense>,
    }

    pub struct GaoyaDetection {
        pub index: MinHashIndex<u32, String>,
        pub min_hasher: MinHasher32<BuildHasherDefault<fnv::FnvHasher>>,
        pub shingle_text_size: usize,
    }
    impl LicenseListActions<Vec<u32>> for GaoyaDetection {
        fn match_by_plain_text(&self, plain_text: String) -> Vec<LicenseMatch> {
            let signature = self.min_hasher.create_signature(shingle_text(
                &strip_license(&strip_spdx_heading(&plain_text)),
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

        fn save_to_file(&self, file_path: String) {
            let mut file = File::create(file_path).unwrap();
            let mut licenses: Vec<_GaoyaComputedLicense> = Vec::new();
            for (name, hash) in self.index.get_id_signature_map().iter() {
                licenses.push(_GaoyaComputedLicense {
                    name: name.clone(),
                    hash: hash.clone(),
                });
            }
            let raw = _Raw { licenses };
            let json = serde_json::to_string(&raw).unwrap();
            file.write_all(json.as_bytes()).unwrap();
        }

        fn load_from_file(&mut self, file_path: String) {
            let mut file = File::open(file_path).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();

            let loaded = serde_json::from_str::<_Raw>(&contents).unwrap_or(_Raw {
                licenses: Vec::new(),
            });
            for license in loaded.licenses {
                self.index.insert(license.name, license.hash);
            }
        }

        fn add_plain(&mut self, license_name: String, license_text: String) {
            let signature = self.min_hasher.create_signature(shingle_text(
                &strip_license(&strip_spdx_heading(&license_text)),
                self.shingle_text_size,
            ));
            self.index.insert(license_name, signature);
        }

        fn remove(&mut self, license_name: String) {
            self.index.remove(&license_name);
        }
    }
}
