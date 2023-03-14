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
use hashing::hashing::hash_license;
use whichlicense_detection::*;

#[test]
fn same_text_produce_same_hash() {
    let text = "This is a test";
    let hash1 = hash_license(text);
    let hash2 = hash_license(text);
    assert_eq!(hash1, hash2);
}

#[test]
fn similar_text_produce_different_hash() {
    let text1 = "This is a test";
    let text2 = "This is a tesu";
    let hash1 = hash_license(text1);
    let hash2 = hash_license(text2);
    assert_ne!(hash1, hash2);
}