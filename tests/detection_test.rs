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
use whichlicense_detection::*;

#[test]
fn it_finds_exact_match() {
    let known_licenses = load_license_db("./licenses/licenses.json");
    assert_eq!(known_licenses.licenses[0].name, detect_hashed_license(&known_licenses.licenses[0].fuzzy, &known_licenses, 100, false)[0].name);
}

// TODO: the other stuff