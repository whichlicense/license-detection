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

pub mod fuzzy_implementation {
    use std::{fs::File, io::Read};

    use fuzzyhash::FuzzyHash;

    use crate::{
        detecting::detecting::{DiskData, LicenseEntry},
        LicenseListActions, LicenseMatch,
    };

    pub struct FuzzyDetection {
        pub licenses: Vec<LicenseEntry<String>>,
        pub min_confidence: u8,
        pub exit_on_exact_match: bool,

        pub normalization_fn: fn(&str) -> String,
    }
    impl LicenseListActions<String> for FuzzyDetection {
        fn match_by_plain_text(&self, plain_text: &str) -> Vec<LicenseMatch> {
            self.match_by_hash(FuzzyHash::new((self.normalization_fn)(plain_text)).to_string())
        }

        fn match_by_hash(&self, hash: String) -> Vec<LicenseMatch> {
            let mut matches: Vec<LicenseMatch> = Vec::new();
            for license in self.licenses.iter() {
                let res = FuzzyHash::compare(&hash, license.hash.as_str());
                let res = match res {
                    Ok(r) => r as u8,
                    Err(_e) => 0,
                };
                if res >= self.min_confidence {
                    matches.push(LicenseMatch {
                        name: license.name.to_string(),
                        confidence: res as f32,
                    });
                    if self.exit_on_exact_match && res == 100 {
                        break;
                    }
                }
            }
            matches.sort_unstable_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
            matches
        }

        fn get_license_list(&self) -> Vec<(String, String)> {
            self.licenses
                .iter()
                .map(|l| (l.name.to_string(), l.hash.to_string()))
                .collect()
        }

        fn load_from_memory(&mut self, raw: &Vec<u8>) {
            let loaded: DiskData<String> = bincode::deserialize(&raw).unwrap_or(DiskData {
                licenses: Vec::new(),
            });
            self.licenses.extend(loaded.licenses);
        }

        fn load_from_file(&mut self, file_path: &str) {
            let mut file = File::open(file_path).unwrap();
            let mut contents = Vec::new();
            file.read_to_end(&mut contents).unwrap();

            self.load_from_memory(&contents);
        }

        fn add_plain(&mut self, license_name: &str, license_text: &str) {
            let stripped = (self.normalization_fn)(license_text);
            let fuzzy = FuzzyHash::new(stripped);
            self.licenses.push(LicenseEntry {
                name: license_name.to_string(),
                hash: fuzzy.to_string(),
            });
        }

        fn hash_from_inline_string(&self, license_text: &str) -> String {
            FuzzyHash::new((self.normalization_fn)(license_text)).to_string()
        }

        fn remove(&mut self, license_name: &str) {
            self.licenses.retain(|l| l.name != license_name.to_string());
        }

        fn set_normalization_fn(&mut self, func: fn(&str) -> String) {
            self.normalization_fn = func;
        }
    }
}
