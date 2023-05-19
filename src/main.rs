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

use detecting::detecting::DEFAULT_NORMALIZATION_FN;
use detecting::fuzzy_implementation::fuzzy_implementation::FuzzyDetection;
use detecting::gaoya_implementation::gaoya_implementation::GaoyaDetection;
use whichlicense_detection::{strip_license, LicenseListActions, LicenseMatch, load_licenses_from_folder, strip_spdx_heading};

use gaoya::minhash::{MinHashIndex, MinHasher32};

fn main() {
    let mut fuzzy = FuzzyDetection {
        licenses: vec![],
        min_confidence: 50,
        exit_on_exact_match: false,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };

    for l in load_licenses_from_folder("./licenses/RAW") {
        fuzzy.add_plain(&l.name, &strip_spdx_heading(&l.text));
    }
    fuzzy.save_to_file("./licenses/fuzzy_db");

    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };

    for l in load_licenses_from_folder("./licenses/RAW") {
        gaoya.add_plain(&l.name, &strip_spdx_heading(&l.text));
    }
    gaoya.save_to_file("./licenses/gaoya_db");
}
