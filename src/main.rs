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

pub mod detecting;
pub mod hashing;
pub mod offloading;

use whichlicense_detection::{
    detect_hashed_license, load_license_db, offloading::threaded_detection::detect_license_threaded,
};

fn benchmark(name: &str, it: &dyn Fn() -> ()){
    let now = std::time::Instant::now();
    it();
    let elapsed = now.elapsed();
    println!("Time elapsed to execute {}: {:.2?}", name, elapsed);
}

fn main() {
    let known_licenses = load_license_db("./licenses/licenses.json");
    let known_licenses1 = known_licenses.clone();

    benchmark("detect_license", &|| {
        detect_hashed_license(
            &String::from("48:watOOhWmk79mRnsbiRIv13Q9rhvpy879PjBpMHWKeEf3NNUfesh/UeUMrI0WPaUg:lomWPJW6OhBjBMHx3NUn/UUCA8cRCY"),
            &known_licenses,
            50,
            false
        );
    });

    benchmark("threaded detect_license", &|| {
        detect_license_threaded(
            32,
            String::from("48:watOOhWmk79mRnsbiRIv13Q9rhvpy879PjBpMHWKeEf3NNUfesh/UeUMrI0WPaUg:lomWPJW6OhBjBMHx3NUn/UUCA8cRCY"),
            &known_licenses1,
            50,
            false
        );
    })

}
