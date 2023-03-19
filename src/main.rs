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

use std::fs::{self, File};
use std::io::Read;
use std::time::Duration;

use whichlicense_detection::{
    create_license_db, hash_license, process_all_licenses,
    strip_license, strip_spdx_heading, License, ComputedLicenseList,
};
use whichlicense_detection::{
    detect_hashed_license, load_license_db, offloading::threaded_detection::detect_license_threaded,
};

use gaoya::minhash::{MinHashIndex, MinHasher, MinHasher32};
use gaoya::text::shingle_text;

/// Benchmarks a given function.
/// Runs the function 10 times and returns the average time it took to execute.
fn benchmark(name: &str, it: &dyn Fn() -> ()) -> Duration {
    let mut elapsed = Duration::new(0, 0);
    for _ in 0..10 {
        let now = std::time::Instant::now();
        it();
        let current_itter_elapsed = now.elapsed();
        elapsed += current_itter_elapsed;
    }
    elapsed /= 10;
    println!("Average time elapsed to execute {}: {:.2?}", name, elapsed);
    elapsed
}

fn gaoya_benchmark(
    name_of_license: &str,
    test_license: &str,
    accuracy_check_license:  &str,

    num_bands: usize,
    band_width: usize,
    shingle_text_size: usize,
) {
    println!(
        "\n\n -- Running Gaoya benchmarks with num_bands:{}, and band_width:{} --",
        num_bands, band_width
    );
    let minhasher = MinHasher32::new(num_bands * band_width);
    let mut index = MinHashIndex::new(num_bands, band_width, 0.5);

    let paths = fs::read_dir("./licenses/RAW").unwrap();

    // add all the licenses to the index.
    for path in paths {
        let mut file = File::open(path.as_ref().unwrap().path()).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();

        let stripped = strip_license(&strip_spdx_heading(&contents));

        index.insert(
            path.unwrap().file_name().to_str().unwrap().to_string(),
            minhasher.create_signature(shingle_text(&stripped, shingle_text_size)),
        );
    }

    let bench_1_duration = benchmark("gaoya_benchmark", &|| {
        // explicitly create a signature for the incoming license to make benchmarks fair.
        let signature = minhasher.create_signature(shingle_text(&test_license, shingle_text_size));
        index.query(&signature);
    });
    // used for prints below.
    let signature_incoming = minhasher.create_signature(shingle_text(&test_license, shingle_text_size));

    // calculate the accuracy of the license detection.
    let accuracy_check_license_signature =
        minhasher.create_signature(shingle_text(accuracy_check_license, shingle_text_size));

    // incoming license is converted into bytes (8 bits per entry) and the signature is 4 bytes per entry (32 bits per entry).
    println!(
        "size of algorithm hash ({} bytes) is less than 50% of the size of the license text({} bytes): {}",
        signature_incoming.len() * 4,
        test_license.bytes().len(),
        signature_incoming.len() * 4 < (test_license.bytes().len() / 2)
    );

    println!(
        "Detection results (must contain {} at 100% confidence): {:?}",
        name_of_license,
        index.query_owned_return_similarity(&signature_incoming)
    );

    println!(
        "1000 licenses would take an average of {:.2?} seconds to detect",
        bench_1_duration.as_secs_f32() * 1000.0
    );

    println!(
        "accuracy check of Apache 2.0 modified license: {:?}",
        index.query_owned_return_similarity(&accuracy_check_license_signature)
    )
}

fn fuzzy_hash_benchmark(
    name_of_license: &str,
    test_license: &str,
    accuracy_check_license:  &str,
) {
    println!("\n\n -- Running FuzzyHash benchmarks --");
    let known_licenses = load_license_db("./licenses/licenses.json");
    let single_threaded_license_detection = benchmark("detect_license", &|| {
        detect_hashed_license(
            &hash_license(test_license),
            &known_licenses.clone(),
            50,
            false,
        );
    });

    let multi_8_threaded_license_detection =
        benchmark("threaded detect_license with 8 threads", &|| {
            detect_license_threaded(
                8,
                hash_license(test_license),
                known_licenses.clone(),
                50,
                false,
            );
        });

    let detection_results = detect_hashed_license(
        &hash_license(test_license),
        &known_licenses.clone(),
        50,
        false,
    );

    let accuracy_check_license_signature = hash_license(accuracy_check_license);
    let accuracy_check_results = detect_hashed_license(
        &accuracy_check_license_signature,
        &known_licenses.clone(),
        50,
        false,
    );

    println!(
        "size of algorithm hash ({} bytes) is less than 50% of the size of the license text({} bytes): {}",
        hash_license(test_license).bytes().len(),
        test_license.bytes().len(),
        hash_license(test_license).bytes().len() < (test_license.bytes().len()/2)
    );
    println!(
        "Detection results (must contain {} at 100% confidence): {:?}",
        name_of_license, detection_results
    );

    println!(
        "1000 licenses would take an average of {:.2?} seconds to detect with a single thread",
        single_threaded_license_detection.as_secs_f32() * 1000.0
    );
    println!(
        "1000 licenses would take an average of {:.2?} seconds to detect with 8 threads",
        multi_8_threaded_license_detection.as_secs_f32() * 1000.0
    );

    println!(
        "accuracy check of Apache 2.0 modified license: {:?}",
        accuracy_check_results
    )
}

fn main() {
    let license_name = "frontier-1.0.LICENSE";
    let mut test_license_file = File::open("./licenses/RAW/frontier-1.0.LICENSE").unwrap();

    let mut test_license_contents = String::new();
    test_license_file
        .read_to_string(&mut test_license_contents)
        .unwrap();
    let test_license = strip_license(&strip_spdx_heading(&test_license_contents)).to_lowercase();

    let apache_modified_license = strip_license("Apache License
    Version 2.0, January 2004
    http://www.apache.org/licenses/
    
    TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION
    
    1. Definitions.
    
    \"License\" shall mean the terms and conditions for use, reproduction,
    and distribution as defined by Sections 1 through 9 of this document.
    
    \"Licensor\" shall mean the copyright owner or entity authorized by
    the copyright owner that is granting the License.
    
    \"Legal Entity\" shall mean the union of the acting entity and all
    other entities that control, are controlled by, or are under common
    control with that entity. For the purposes of this definition,
    \"control\" means (i) the power, direct or indirect, to cause the
    direction or management of such entity, whether by contract or
    otherwise, or (ii) ownership of fifty percent (50%) or more of the
    outstanding shares, or (iii) beneficial ownership of such entity.
    
    \"You\" (or \"Your\") shall mean an individual or Legal Entity
    exercising permissions granted by this License.
    
    \"Source\" form shall mean the preferred form for making modifications,
    including but not limited to software source code, documentation
    source, and configuration files.
    
    \"Object\" form shall mean any form resulting from mechanical
    transformation or translation of a Source form, including but
    not limited to compiled object code, generated documentation,
    and conversions to other media types.
    
    \"Work\" shall mean the work of authorship, whether in Source or
    Object form, made available under the License, as indicated by a
    copyright notice that is included in or attached to the work
    (an example is provided in the Appendix below).
    
    \"Derivative Works\" shall mean any work, whether in Source or Object
    form, that is based on (or derived from) the Work and for which the
    editorial revisions, annotations, elaborations, or other modifications
    represent, as a whole, an original work of authorship. For the purposes
    of this License, Derivative Works shall not include works that remain
    separable from, or merely link (or bind by name) to the interfaces of,
    the Work and Derivative Works thereof.
    
    \"Contribution\" shall mean any work of authorship, including
    the original version of the Work and any modifications or additions
    to that Work or Derivative Works thereof, that is intentionally
    submitted to Licensor for inclusion in the Work by the copyright owner
    or by an individual or Legal Entity authorized to submit on behalf of
    the copyright owner. For the purposes of this definition, \"submitted\"
    means any form of electronic, verbal, or written communication sent
    to the Licensor or its representatives, including but not limited to
    communication on electronic mailing lists, source code control systems,
    and issue tracking systems that are managed by, or on behalf of, the
    Licensor for the purpose of discussing and improving the Work, but
    excluding communication that is conspicuously marked or otherwise
    designated in writing by the copyright owner as \"Not a Contribution.\"
    
    \"Contributor\" shall mean Licensor and any individual or Legal Entity
    on behalf of whom a Contribution has been received by Licensor and
    subsequently incorporated within the Work.
    
    2. Grant of Copyright License. Subject to the terms and conditions of
    this License, each Contributor hereby grants to You a perpetual,
    worldwide, non-exclusive, no-charge, royalty-free, irrevocable
    copyright license to reproduce, prepare Derivative Works of,
    publicly display, publicly perform, sublicense, and distribute the
    Work and such Derivative Works in Source or Object form.
    
    3. Grant of Patent License. Subject to the terms and conditions of
    this License, each Contributor hereby grants to You a perpetual,
    worldwide, non-exclusive, no-charge, royalty-free, irrevocable
    (except as stated in this section) patent license to make, have made,
    use, offer to sell, sell, import, and otherwise transfer the Work,
    where such license applies only to those patent claims licensable
    by such Contributor that are necessarily infringed by their
    Contribution(s) alone or by combination of their Contribution(s)
    with the Work to which such Contribution(s) was submitted. If You
    institute patent litigation against any entity (including a
    cross-claim or counterclaim in a lawsuit) alleging that the Work
    or a Contribution incorporated within the Work constitutes direct
    or contributory patent infringement, then any patent licenses
    granted to You under this License for that Work shall terminate
    as of the date such litigation is filed.
    
    4. Redistribution. You may reproduce and distribute copies of the
    Work or Derivative Works thereof in any medium, with or without
    modifications, and in Source or Object form, provided that You
    meet the following conditions:
    
    (a) You must give any other recipients of the Work or
    Derivative Works a copy of this License; and
    
    (b) You must cause any modified files to carry prominent notices
    stating that You changed the files; and
    
    (c) You must retain, in the Source form of any Derivative Works
    that You distribute, all copyright, patent, trademark, and
    attribution notices from the Source form of the Work,
    excluding those notices that do not pertain to any part of
    the Derivative Works; and
    
    (d) If the Work includes a \"NOTICE\" text file as part of its
    distribution, then any Derivative Works that You distribute must
    include a readable copy of the attribution notices contained
    within such NOTICE file, excluding those notices that do not
    pertain to any part of the Derivative Works, in at least one
    of the following places: within a NOTICE text file distributed
    as part of the Derivative Works; within the Source form or
    documentation, if provided along with the Derivative Works; or,
    within a display generated by the Derivative Works, if and
    wherever such third-party notices normally appear. The contents
    of the NOTICE file are for informational purposes only and
    do not modify the License. You may add Your own attribution
    notices within Derivative Works that You distribute, alongside
    or as an addendum to the NOTICE text from the Work, provided
    that such additional attribution notices cannot be construed
    as modifying the License.
    
    You may add Your own copyright statement to Your modifications and
    may provide additional or different license terms and conditions
    for use, reproduction, or distribution of Your modifications, or
    for any such Derivative Works as a whole, provided Your use,
    reproduction, and distribution of the Work otherwise complies with
    the conditions stated in this License.
    
    5. Submission of Contributions. Unless You explicitly state otherwise,
    any Contribution intentionally submitted for inclusion in the Work
    by You to the Licensor shall be under the terms and conditions of
    this License, without any additional terms or conditions.
    Notwithstanding the above, nothing herein shall supersede or modify
    the terms of any separate license agreement you may have executed
    with Licensor regarding such Contributions.
    
    6. Trademarks. This License does not grant permission to use the trade
    names, trademarks, service marks, or product names of the Licensor,
    except as required for reasonable and customary use in describing the
    origin of the Work and reproducing the content of the NOTICE file.
    
    7. Disclaimer of Warranty. Unless required by applicable law or
    agreed to in writing, Licensor provides the Work (and each
    Contributor provides its Contributions) on an \"AS IS\" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
    implied, including, without limitation, any warranties or conditions
    of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
    PARTICULAR PURPOSE. You are solely responsible for determining the
    appropriateness of using or redistributing the Work and assume any
    risks associated with Your exercise of permissions under this License.
    
    8. Limitation of Liability. In no event and under no legal theory,
    whether in tort (including negligence), contract, or otherwise,
    unless required by applicable law (such as deliberate and grossly
    negligent acts) or agreed to in writing, shall any Contributor be
    liable to You for damages, including any direct, indirect, special,
    incidental, or consequential damages of any character arising as a
    result of this License or out of the use or inability to use the
    Work (including but not limited to damages for loss of goodwill,
    work stoppage, computer failure or malfunction, or any and all
    other commercial damages or losses), even if such Contributor
    has been advised of the possibility of such damages.
    
    9. Accepting Warranty or Additional Liability. While redistributing
    the Work or Derivative Works thereof, You may choose to offer,
    and charge a fee for, acceptance of support, warranty, indemnity,
    or other liability obligations and/or rights consistent with this
    License. However, in accepting such obligations, You may act only
    on Your own behalf and on Your sole responsibility, not on behalf
    of any other Contributor, and only if You agree to indemnify,
    defend, and hold each Contributor harmless for any liability
    incurred by, or claims asserted against, such Contributor by reason
    of your accepting any such warranty or additional liability.
    
    END OF TERMS AND CONDITIONS
    
    APPENDIX: How to apply the Apache License to your work.
    
    To apply the Apache License to your work, attach the following
    boilerplate notice
    
    Copyright (c) 2023 Duart Snel
    
    Licensed under the Apache License, Version 2.0 (the \"License\");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
    http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an \"AS IS\" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.");


    gaoya_benchmark(
        license_name,
        &test_license.clone(),
        &apache_modified_license.clone(),
        42,
        3,
        50
    );

    // for num_bands in 1..=10 {
    //     for band_width in 1..=10 {
    //         gaoya_benchmark(
    //             license_name,
    //             &test_license.clone(),
    //             (
    //                 original_accuracy_check_license.clone(),
    //                 modified_accuracy_check_license.clone(),
    //             ),
    //             num_bands * 10, band_width * 10
    //         );
    //     }
    // }

    fuzzy_hash_benchmark(
        license_name,
        &test_license.clone(),
        &apache_modified_license.clone(),
    );



    
}
