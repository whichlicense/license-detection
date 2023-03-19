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

    use crate::LicenseMatch;


    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct ComputedLicense {
        pub name: String,
        pub hash: String,
    }

    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct ComputedLicenseList {
        pub licenses: Vec<ComputedLicense>,
    }
    pub trait LicenseListActions {
        /// Converts the plain text into a representation that can be used to find a license
        /// then runs the match_by_hash function on that representation.
        fn match_by_plain_text(&self, plain_text: String) -> Vec<LicenseMatch>;

        /// Attempts to find one or more matching licenses by hash.
        fn match_by_hash(&self, hash: String) -> Vec<LicenseMatch>;

        /// Saves the computed license list to a file.
        fn save_to_file(&self, file_path: String);

        /// Loads a computed license list from a file and stores it in the hosting struct.
        fn load_from_file(&mut self, file_path: String);

        /// Adds a license that has yet to be computed to the list.
        /// 
        /// This license must be in plain text format.
        fn add_plain(&mut self, license_name: String, license_text: String);

        /// Removes a license from the list.
        fn remove(&mut self, license_name: String);
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

    pub fn process_all_licenses(folder_path: &str) -> ComputedLicenseList {
        let paths = fs::read_dir(folder_path).unwrap();
        let mut licenses: Vec<ComputedLicense> = Vec::new();

        for path in paths {
            let mut file = File::open(path.as_ref().unwrap().path()).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();

            let stripped = strip_license(&strip_spdx_heading(&contents)); // TODO: less borrowing, more taking

            let fuzzy = FuzzyHash::new(stripped);
            licenses.push(ComputedLicense {
                name: path.unwrap().file_name().to_str().unwrap().to_string(),
                hash: fuzzy.to_string(),
            });
        }

        {
            ComputedLicenseList { licenses }
        }
    }

    pub fn process_all_licenses_manual(folder_path: &str, hash_fn: fn(plain_text: String) -> String ) -> ComputedLicenseList {
        let paths = fs::read_dir(folder_path).unwrap();
        let mut licenses: Vec<ComputedLicense> = Vec::new();

        for path in paths {
            let mut file = File::open(path.as_ref().unwrap().path()).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();

            let stripped = strip_license(&strip_spdx_heading(&contents)); // TODO: less borrowing, more taking

            licenses.push(ComputedLicense {
                name: path.unwrap().file_name().to_str().unwrap().to_string(),
                hash: hash_fn(stripped),
            });
        }
            
        {
            ComputedLicenseList { licenses }
        }
    }
}
