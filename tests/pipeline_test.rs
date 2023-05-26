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

use regex::Regex;
use whichlicense_detection::{*, detecting::fuzzy_implementation::fuzzy_implementation::FuzzyDetection};

fn create_testing_algorithm()-> FuzzyDetection {
    let mut fuzzy = FuzzyDetection {
        licenses: vec![],
        min_confidence: 50,
        exit_on_exact_match: false,
        normalization_fn: |x| x.to_string(),
    };

    fuzzy.add_plain("test_license_1", "this is a test license");
    fuzzy.add_plain("test_license_2", "this is a different test license");
    fuzzy.add_plain("test_license_3", "aaaaaaaaaaaaaaaaa");
    fuzzy.add_plain("test_license_4", "bbbbbbbbbbbbbbbbb");
    fuzzy.add_plain("test_license_5", "Hello, world!");

    fuzzy
}



#[test]
fn it_clamps_run_confidence(){
    let alg = create_testing_algorithm();
    
    let pipeline = Pipeline::new(vec![
        Segment::Remove(Using::Regex(Regex::new(r"-").unwrap())),
        // first segment should remove all dashes and thus give the next run a confidence of 100
        Segment::Remove(Using::Regex(Regex::new(r"Hello, world!").unwrap())), // i.e., don't run this one!
    ]);

    // high confidence indicates that this pipeline should continue running; however, due to clamping it should not.
    // the pipeline should stop after the first segment, and thus the confidence should be 100.
    let results = pipeline.run(&alg, "-----Hello, world!-----", 696.9);

    assert!(results.len() == 2);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}

#[test]
fn it_runs_multiple(){
    let alg = create_testing_algorithm();
    
    let pipeline = Pipeline::new(vec![
        Segment::Remove(Using::Regex(Regex::new(r"-").unwrap())),
        Segment::Remove(Using::Regex(Regex::new(r"X").unwrap())),
    ]);

    let results = pipeline.run(&alg, "-X-X-X-X-Hello, world!-X-X-X-X-", 100.0);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}

#[test]
fn it_runs_remove_using_regex(){
    let alg = create_testing_algorithm();

    
    let pipeline = Pipeline::new(vec![
        Segment::Remove(Using::Regex(Regex::new(r"-").unwrap())),
    ]);

    let results = pipeline.run(&alg, "-----Hello, world!-----", 100.0);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}

#[test]
fn it_runs_remove_using_text(){
    let alg = create_testing_algorithm();

    
    let pipeline = Pipeline::new(vec![
        Segment::Remove(Using::Text("-".to_string())),
    ]);

    let results = pipeline.run(&alg, "-----Hello, world!-----", 100.0);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}

#[test]
fn it_executes_custom(){
    let alg = create_testing_algorithm();

    let pipeline = Pipeline::new(vec![
        Segment::Custom(Box::new(|x| x.replace("-", ""))),
    ]);

    let results = pipeline.run(&alg, "-----Hello, world!-----", 100.0);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}

#[test]
fn it_executed_custom_with_external_data(){
    let alg = create_testing_algorithm();

    let replacer = "-";

    let pipeline = Pipeline::new(vec![
        Segment::Custom(Box::new(move |x| x.replace(replacer, ""))),
    ]);

    let results = pipeline.run(&alg, "-----Hello, world!-----", 100.0);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}

#[test]
fn it_executes_replace_using_regex(){
    let alg = create_testing_algorithm();

    let pipeline = Pipeline::new(vec![
        Segment::Replace(Using::Regex(Regex::new(r"-").unwrap()), "".to_string()),
    ]);

    let results = pipeline.run(&alg, "-----Hello, world!-----", 100.0);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}

#[test]
fn it_executes_replace_using_text(){
    let alg = create_testing_algorithm();

    let pipeline = Pipeline::new(vec![
        Segment::Replace(Using::Text("-".to_string()), "".to_string()),
    ]);

    let results = pipeline.run(&alg, "-----Hello, world!-----", 100.0);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}

#[test]
fn it_executes_batch(){
    let alg = create_testing_algorithm();

    let pipeline = Pipeline::new(vec![
        Segment::Batch(vec![
            Segment::Remove(Using::Regex(Regex::new(r"-").unwrap())),
            Segment::Remove(Using::Regex(Regex::new(r"X").unwrap())),
        ]),
    ]);

    let results = pipeline.run(&alg, "-X-X-X-X-Hello, world!-X-X-X-X-", 100.0);

    assert!(results.last().unwrap().get(0).unwrap().confidence == 100.0);
    assert!(results.last().unwrap().get(0).unwrap().name == "test_license_5");
}