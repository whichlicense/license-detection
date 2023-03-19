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

pub mod hashing {
    use std::{fs::{self, File}, io::Read};

    use fuzzyhash::FuzzyHash;
    use regex::Regex;
    use serde::{Deserialize, Serialize};


    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct License {
        pub name: String,
        pub hash: String,
    }

    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct LicenseList {
        pub licenses: Vec<License>,
    }

    pub fn strip_spdx_heading(l: &str) -> String {
        // TODO: return a vector with the groups in one slot and the replaced string in the other
        Regex::new(r"(---\n)(\n|.)+(---\n)")
            .unwrap()
            .replace_all(l, "")
            .to_string()
    }

    pub fn strip_license(l: &str) -> String {
        Regex::new(r"( |\t|\n|\r|\n\r|\r\n)")
            .unwrap()
            .replace_all(l, "")
            .to_string()
    }

    pub fn hash_license(l: &str) -> String {
        let fuzzy = FuzzyHash::new(l);
        fuzzy.to_string()
    }

    pub fn process_all_licenses(folder_path: &str) -> LicenseList {
        let paths = fs::read_dir(folder_path).unwrap();
        let mut licenses: Vec<License> = Vec::new();

        for path in paths {
            let mut file = File::open(path.as_ref().unwrap().path()).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();

            let stripped = strip_license(&strip_spdx_heading(&contents)); // TODO: less borrowing, more taking

            let fuzzy = FuzzyHash::new(stripped);
            licenses.push(License {
                name: path.unwrap().file_name().to_str().unwrap().to_string(),
                hash: fuzzy.to_string(),
            });
        }

        {
            LicenseList { licenses }
        }
    }

    pub fn process_all_licenses_manual(folder_path: &str, hash_fn: fn(plain_text: String) -> String ) -> LicenseList {
        let paths = fs::read_dir(folder_path).unwrap();
        let mut licenses: Vec<License> = Vec::new();

        for path in paths {
            let mut file = File::open(path.as_ref().unwrap().path()).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();

            let stripped = strip_license(&strip_spdx_heading(&contents)); // TODO: less borrowing, more taking

            licenses.push(License {
                name: path.unwrap().file_name().to_str().unwrap().to_string(),
                hash: hash_fn(stripped),
            });
        }
            
        {
            LicenseList { licenses }
        }
    }
}
