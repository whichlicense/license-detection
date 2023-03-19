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

pub mod license_tools {
    use std::{fs::{self, File}, io::Read};
    use regex::Regex;

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

    pub struct RawLicense {
        pub name: String,
        pub text: String,
    }

    /// loads and returns a vector of RawLicense structs containing the name and plain text of each license.
    pub fn load_licenses_from_folder(folder_path: &str) -> Vec<RawLicense> {
        let paths = fs::read_dir(folder_path).unwrap();
        let mut licenses: Vec<RawLicense> = Vec::new();

        for path in paths {
            let mut file = File::open(path.as_ref().unwrap().path()).unwrap();
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();

            licenses.push(RawLicense {
                name: path.unwrap().file_name().to_str().unwrap().to_string(),
                text: contents,
            });
        }

        licenses
    }
}
