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

use std::{fs::File, io::{Read, BufReader}, path::Path, vec};
use gaoya::{minhash::{MinHashIndex, MinHasher32, MinHasher}, text::shingle_text};
use serde_json::json;
use whichlicense_detection::{*, detecting::gaoya_implementation::gaoya_implementation::GaoyaDetection};

#[test]
fn it_finds_exact_match() {
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };

    for l in load_licenses_from_folder("./licenses/RAW"){
        gaoya.add_plain(&l.name, &strip_spdx_heading(&l.text));
    }

    let res = gaoya.match_by_hash(gaoya.index.get_signature(&String::from("apache-2.0.LICENSE")).unwrap().to_vec());

    assert_eq!(res[0].name, "apache-2.0.LICENSE");
    assert_eq!(res[0].confidence, 100.0);
}

#[test]
fn it_detects_with_over_90_confidence_with_similar_license() {
    let apache_test_license = "Apache License
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
    limitations under the License.";

    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };

    for l in load_licenses_from_folder("./licenses/RAW"){
        gaoya.add_plain(&l.name, &strip_spdx_heading(&l.text));
    }

    let matches = gaoya.match_by_plain_text(apache_test_license);

    assert!(matches.len() > 0, "No matches found!! Is the database populated? is apache's license in the database?");
    assert_eq!(matches[0].name, "apache-2.0.LICENSE");
    assert!(matches[0].confidence > 90.0);
}

#[test]
fn it_fails_on_unknown(){
    let unknown_license = "This is not a license. lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };

    for l in load_licenses_from_folder("./licenses/RAW"){
        gaoya.add_plain(&l.name, &strip_spdx_heading(&l.text));
    }

    let matches = gaoya.match_by_plain_text(unknown_license);
    assert!(matches.len() == 0, "Found a match for an unknown license!");
}

#[test]
fn it_filters_on_min_confidence(){
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };

    for l in load_licenses_from_folder("./licenses/RAW"){
        gaoya.add_plain(&l.name, &strip_spdx_heading(&l.text));
    }
    
    // gets this project's current license
    let file = File::open("./LICENSE").unwrap();
    let mut reader = BufReader::new(file);
    let mut license = String::new();
    reader.read_to_string(&mut license).unwrap();


    let matches = gaoya.match_by_plain_text(&license);
    assert!(matches.len() > 0, "No matches found!! Is the database populated? is apache's license in the database?");

    assert!(matches[0].confidence == 100.0);
    assert_eq!(matches[0].name, "apache-2.0.LICENSE");

    for m in matches.iter(){
        assert!(m.confidence >= 50.0, "Confidence was lower than the supplied minimum confidence!");
    }
}

#[test]
fn add_plain_works(){
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };
    gaoya.add_plain("test_license", "This is a test license");

    assert!(gaoya.index.get_id_signature_map().contains_key("test_license"));
    assert!(gaoya.index.get_id_signature_map().get("test_license").unwrap().len() > 0);
    assert!(gaoya.index.get_id_signature_map().len() > 0);
}

#[test]
fn it_saves_to_file(){
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };
    gaoya.add_plain("test_license", "This is a test license");

    gaoya.save_to_file("./test_db.json");

    // assert that file exists
    assert!(Path::new("./test_db.json").try_exists().is_ok());
}

#[test]
fn it_loads_from_saved_file(){
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };
    gaoya.add_plain("test_license", "This is a test license");
    gaoya.save_to_file("./test_db.json");
    gaoya.load_from_file("./test_db.json");

    assert!(gaoya.index.get_id_signature_map().contains_key("test_license"));
    assert!(gaoya.index.get_id_signature_map().get("test_license").unwrap().len() > 0);
    assert!(gaoya.index.get_id_signature_map().len() > 0);
}

#[test]
fn it_hashes_from_inline_string(){
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };
    let res = gaoya.hash_from_inline_string("This is a test license");
    gaoya.index.insert(String::from("test_license"), res.clone());

    
    assert!(res.len() > 0);
    assert!(
        gaoya.match_by_plain_text("This is a test license").iter().any(|x| x.name == "test_license"),
    )
}

#[test]
fn it_loads_from_inline_string(){
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };

    let signature = gaoya.min_hasher.create_signature(shingle_text(
        &strip_license(&strip_spdx_heading(&"This is a test license")),
        gaoya.shingle_text_size,
    ));
    gaoya.load_from_inline_string(&json!(
        {
            "licenses": [
                {
                    "name": "test_license",
                    "hash": signature
                }
            ]
        }
    ).to_string());

    assert!(gaoya.index.get_id_signature_map().contains_key("test_license"));
    assert!(gaoya.index.get_id_signature_map().get("test_license").unwrap().len() > 0);
    assert!(gaoya.index.get_id_signature_map().len() > 0);
}

#[test]
fn remove_works(){
    let mut gaoya = GaoyaDetection {
        index: MinHashIndex::new(42, 3, 0.5),
        min_hasher: MinHasher32::new(42 * 3),
        shingle_text_size: 50,
        normalization_fn: DEFAULT_NORMALIZATION_FN,
    };
    gaoya.add_plain("test_license", "This is a test license");

    gaoya.remove("test_license");

    assert!(gaoya.index.size()  == 0);
}