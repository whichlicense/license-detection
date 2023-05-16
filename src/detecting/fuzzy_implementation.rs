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
    use std::{
        fs::File,
        io::{Read, Write},
    };

    use fuzzyhash::FuzzyHash;

    use serde::{Serialize, Deserialize};

    use crate::{
        strip_license, LicenseListActions, LicenseMatch, detecting::detecting::DiskData,
    };

    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct ComputedLicense {
        pub name: String,
        pub hash: String,
    }

    pub struct FuzzyDetection {
        pub licenses: Vec<ComputedLicense>,
        pub min_confidence: u8,
        pub exit_on_exact_match: bool,
    }
    impl LicenseListActions<String> for FuzzyDetection {
        fn match_by_plain_text(&self, plain_text: String) -> Vec<LicenseMatch> {
            self.match_by_hash(
                FuzzyHash::new(strip_license(&plain_text)).to_string(),
            )
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

        fn save_to_file(&self, file_path: String) {
            let serialized = serde_json::to_string::<DiskData<ComputedLicense>>(&DiskData {
                licenses: self.licenses.clone(),
            }).unwrap();
            let mut file = File::create(file_path).unwrap();
            file.write_all(serialized.as_bytes()).unwrap();
        }

        fn load_from_file(&mut self, file_path: String) {
            let mut file = File::open(file_path).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();

            self.load_from_inline_string(contents);
        }

        fn load_from_inline_string(&mut self, json: String) {
            let loaded =
                serde_json::from_str::<DiskData<ComputedLicense>>(&json)
                    .unwrap_or(DiskData {
                        licenses: Vec::new(),
                    });
            self.licenses.clear();
            self.licenses.extend(loaded.licenses);
        }

        fn add_plain(&mut self, license_name: String, license_text: String) {
            let stripped = strip_license(&license_text);
            let fuzzy = FuzzyHash::new(stripped);
            self.licenses.push(ComputedLicense {
                name: license_name,
                hash: fuzzy.to_string(),
            });
        }

        fn hash_from_inline_string(&self, license_text: String) -> String {
            FuzzyHash::new(strip_license(&license_text)).to_string()
        }

        fn remove(&mut self, license_name: String) {
            self.licenses.retain(|l| l.name != license_name);
        }
    }
}
