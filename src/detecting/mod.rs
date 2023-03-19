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

pub mod fuzzy_implementation;
pub mod gaoya_implementation;

pub mod detecting {
    use serde::{Serialize, Deserialize};

    #[derive(Debug)]
    pub struct LicenseMatch {
        pub name: String,
        pub confidence: f32,
    }

    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct ComputedLicense {
        pub name: String,
        pub hash: String,
    }

    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct ComputedLicenseList {
        pub licenses: Vec<ComputedLicense>,
    }
    pub trait LicenseListActions<T> {
        /// Converts the plain text into a representation that can be used to find a license
        /// then runs the match_by_hash function on that representation.
        fn match_by_plain_text(&self, plain_text: String) -> Vec<LicenseMatch>;

        /// Attempts to find one or more matching licenses by hash.
        fn match_by_hash(&self, hash: T) -> Vec<LicenseMatch>;

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
}
