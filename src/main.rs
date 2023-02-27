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

use std::fs;


pub mod detecting;
pub mod hashing;

pub use crate::detecting::detecting::{load_license_db, detect_license};


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
