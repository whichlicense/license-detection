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
use hashing::license_tools::{strip_license, hash_license};
use std::{fs::File, io::{Read, BufReader}};
use whichlicense_detection::*;

#[test]
fn it_creates_a_license_db(){
    let file = File::open("./LICENSE").unwrap();
    let mut reader = BufReader::new(file);
    let mut license = String::new();
    reader.read_to_string(&mut license).unwrap();

    let hashed_license_1 = hash_license(&strip_license(&license));

    let license_list: ComputedLicenseList = ComputedLicenseList {
        licenses: vec![ 
            ComputedLicense {
                name: String::from("Apache-2.0"),
                hash: hashed_license_1.clone(),
            }
        ]
    };

    create_license_db(license_list, "test_db.json");

    let file = File::open("./test_db.json").unwrap();
    let mut reader = BufReader::new(file);
    let mut license = String::new();
    reader.read_to_string(&mut license).unwrap();

    assert!(license.contains("Apache-2.0"));
    assert!(license.contains(&hashed_license_1));
}

#[test]
fn it_loads_a_license_db(){
    let license_list = load_license_db("./test_db.json");

    assert!(license_list.licenses.len() == 1);
    assert_eq!(license_list.licenses[0].name, "Apache-2.0");
    assert!(license_list.licenses[0].hash.len() > 0);

    let file = File::open("./LICENSE").unwrap();
    let mut reader = BufReader::new(file);
    let mut license = String::new();
    reader.read_to_string(&mut license).unwrap();

    let hashed_license_1 = hash_license(&strip_license(&license));

    assert!(license_list.licenses[0].hash.contains(&hashed_license_1));

}