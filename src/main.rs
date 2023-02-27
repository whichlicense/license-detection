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

use fuzzyhash::FuzzyHash;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json;
use std::{
    fs::{self, File},
    io::{Read, Write},
};

#[derive(Serialize, Deserialize, Debug)]
struct License {
    name: String,
    fuzzy: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct LicenseList {
    licenses: Vec<License>,
}

struct LicenseMatch {
    name: String,
    confidence: u8,
}

fn strip_spdx_heading(l: &str) -> String {
    // TODO: return a vector with the groups in one slot and the replaced string in the other
    Regex::new(r"(---\n)(\n|.)+(---\n)")
        .unwrap()
        .replace_all(l, "")
        .to_string()
}

fn strip_license(l: &str) -> String {
    Regex::new(r"( |\t|\n|\r|\n\r|\r\n)")
        .unwrap()
        .replace_all(l, "")
        .to_string()
}

fn process_all_licenses(folder_path: &str) -> LicenseList {
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
            fuzzy: fuzzy.to_string(),
        });
    }

    {
        LicenseList { licenses }
    }
}

fn create_license_db(licenses: LicenseList, file: &str) {
    let serialized = serde_json::to_string(&licenses).unwrap();
    let mut file = File::create(file).unwrap();
    file.write_all(serialized.as_bytes()).unwrap();
}

fn load_license_db(file: &str) -> LicenseList {
    let mut file = File::open(file).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    serde_json::from_str(&contents).unwrap()
}

fn detect_hashed_license(
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
    matches
}

fn detect_license(
    incoming_license: &str,
    known_licenses: &LicenseList,
    min_confidence: u8,
    exit_on_exact_match: bool
) -> Vec<LicenseMatch> {
    detect_hashed_license(
        &FuzzyHash::new(strip_license(&strip_spdx_heading(&incoming_license))).to_string(),
        known_licenses,
        min_confidence,
        exit_on_exact_match
    )
}

fn main() {
    // let ll = process_all_licenses("./licenses/RAW");
    // create_license_db(ll, "./licenses/licenses.json");
    let lres = load_license_db("./licenses/licenses.json");
    // println!("{:?}", lres.licenses[0].fuzzy);

    // let res = detect_hashed_license(&lres.licenses[2000].fuzzy, &lres, 90);
    let res = detect_license(
        &fs::read_to_string("./licenses/RAW/bsd-dpt.LICENSE").unwrap(),
        &lres,
        10,
        true
    );

    println!("{} matches found", res.len());
    for r in res {
        println!("{}: {}", r.name, r.confidence);
    }
}
