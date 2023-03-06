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

use std::time::Duration;

use whichlicense_detection::{
    detect_hashed_license, load_license_db, offloading::threaded_detection::detect_license_threaded,
};

fn benchmark(name: &str, it: &dyn Fn() -> ()) -> Duration {
    let now = std::time::Instant::now();
    it();
    let elapsed = now.elapsed();
    println!("Time elapsed to execute {}: {:.2?}", name, elapsed);
    elapsed
}

fn main() {
    let known_licenses = load_license_db("./licenses/licenses.json");
    // let known_licenses1 = known_licenses.clone();

    let single_threaded_license_detection = benchmark("detect_license", &|| {
        detect_hashed_license(
            &String::from("48:watOOhWmk79mRnsbiRIv13Q9rhvpy879PjBpMHWKeEf3NNUfesh/UeUMrI0WPaUg:lomWPJW6OhBjBMHx3NUn/UUCA8cRCY"),
            &known_licenses.clone(),
            50,
            false
        );
    });

    let multi_threaded_license_detection = benchmark("threaded detect_license",  &|| {
        detect_license_threaded(
            32,
            String::from("48:watOOhWmk79mRnsbiRIv13Q9rhvpy879PjBpMHWKeEf3NNUfesh/UeUMrI0WPaUg:lomWPJW6OhBjBMHx3NUn/UUCA8cRCY"),
            known_licenses.clone(),
            50,
            false
        );
    });

    println!("1000 licenses would take an average of {:.2?} seconds to detect with a single thread", single_threaded_license_detection.as_secs_f32() * 1000.0);
    println!("1000 licenses would take an average of {:.2?} seconds to detect with 32 threads", multi_threaded_license_detection.as_secs_f32() * 1000.0);
}
