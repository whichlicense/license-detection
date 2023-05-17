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
    use crate::strip_license;

    #[derive(Debug)]
    pub struct LicenseMatch {
        pub name: String,
        pub confidence: f32,
    }

    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct DiskData<K> {
        pub licenses: Vec<K>,
    }

    pub static DEFAULT_NORMALIZATION_FN: fn(&str) -> String = strip_license;
    pub trait LicenseListActions<T> {
        /// Converts the plain text into a representation that can be used to find a license
        /// then runs the match_by_hash function on that representation.
        fn match_by_plain_text(&self, plain_text: &str) -> Vec<LicenseMatch>;

        /// Attempts to find one or more matching licenses by hash.
        fn match_by_hash(&self, hash: T) -> Vec<LicenseMatch>;

        /// Saves the computed license list to a file.
        fn save_to_file(&self, file_path: &str);

        /// Loads a computed license list from a file and stores it in the hosting struct.
        fn load_from_file(&mut self, file_path: &str);

        fn load_from_inline_string(&mut self, json: &str);

        /// Adds a license that has yet to be computed to the list.
        /// 
        /// This license must be in plain text format.
        fn add_plain(&mut self, license_name: &str, license_text: &str);

        /// Computes the hash of the given license_text string and returns it.
        fn hash_from_inline_string(&self, license_text: &str) -> T;

        /// Removes a license from the list.
        fn remove(&mut self, license_name: &str);

        /// Changes the normalization function.
        /// 
        /// The normalization function is used to convert the license text into a representation
        /// that can be used to compute the hash, so that the confidence is not affected by text changes that do not matter,
        /// for example stylistic formatting changes.
        fn set_normalization_fn(&mut self, func: fn(&str) -> String);
    }
}
