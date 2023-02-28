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

pub mod detecting {
    use fuzzyhash::FuzzyHash;
    use serde_json;
    use std::{
        fs::File,
        io::{Read, Write},
    };
    use crate::hashing::hashing::{LicenseList, strip_spdx_heading, strip_license};

    #[derive(Debug)]
    pub struct LicenseMatch {
        pub name: String,
        pub confidence: u8,
    }

    pub fn create_license_db(licenses: LicenseList, file: &str) {
        let serialized = serde_json::to_string(&licenses).unwrap();
        let mut file = File::create(file).unwrap();
        file.write_all(serialized.as_bytes()).unwrap();
    }

    pub fn load_license_db(file: &str) -> LicenseList {
        let mut file = File::open(file).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        serde_json::from_str(&contents).unwrap()
    }

    pub fn detect_hashed_license(
        incoming_license_hash: &str,
        known_licenses: &LicenseList,
        min_confidence: u8,
        exit_on_exact_match: bool,
    ) -> Vec<LicenseMatch> {
        let mut matches: Vec<LicenseMatch> = Vec::new();
        for license in known_licenses.licenses.iter() {
            let res = FuzzyHash::compare(incoming_license_hash, license.fuzzy.as_str());
            let res = match res {
                Ok(r) => r as u8,
                Err(_e) => 0,
            };
            if res >= min_confidence {
                matches.push(LicenseMatch {
                    name: license.name.to_string(),
                    confidence: res,
                });
                if exit_on_exact_match && res == 100 {
                    break;
                }
            }
        }
        matches.sort_unstable_by(|a, b| b.confidence.cmp(&a.confidence));
        matches
    }

    pub fn detect_license(
        incoming_license: &str,
        known_licenses: &LicenseList,
        min_confidence: u8,
        exit_on_exact_match: bool,
    ) -> Vec<LicenseMatch> {
        detect_hashed_license(
            &FuzzyHash::new(strip_license(&strip_spdx_heading(&incoming_license))).to_string(),
            known_licenses,
            min_confidence,
            exit_on_exact_match,
        )
    }
}
