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

pub mod threaded_detection {
    use crate::{detecting::detecting::*, hashing::hashing::LicenseList};
    use std::{thread, sync::mpsc};

    /// # Do not use this function! it is slower than the non-threaded version and only serves as a placeholder for my mid-term report!!!.
    pub fn detect_license_threaded(
        n_threads: usize,
        incoming_license_hash: String,
        known_licenses: &LicenseList,
        min_confidence: u8,
        exit_on_exact_match: bool,
    ) -> Vec<LicenseMatch> {
        let licenses_per_thread: usize =
            (known_licenses.licenses.len() as f32 / n_threads as f32).floor() as usize;
        let (tx, rx) = mpsc::channel(); 

        let mut threads = vec![];
        for i in 0..n_threads {
            let incoming_license_hash = incoming_license_hash.clone();
            let min_confidence = min_confidence.clone();
            let exit_on_exact_match = exit_on_exact_match.clone();
            let known_licenses = known_licenses.clone();
            let personal_tx = tx.clone();
            threads.push(thread::spawn(move || {
                let license_db_slice = &known_licenses.licenses
                    [i * licenses_per_thread..(i + 1) * licenses_per_thread];
                let res = detect_hashed_license(
                    &incoming_license_hash,
                    &LicenseList {
                        licenses: license_db_slice.to_vec(),
                    },
                    min_confidence,
                    exit_on_exact_match,
                );
                // send results
                personal_tx.send(res).unwrap();
            }));
        }

        let mut results = vec![];
        let mut received_from = 0;
        for received in rx {
            received_from += 1;
            for r in received {
                results.push(r);
            }
            if received_from == n_threads {
                break;
            }
        }

        for thread in threads {
            thread.join().expect("Failed to join thread");
        }

        results
    }
}