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

pub mod pipeline {
    use crate::{LicenseListActions, LicenseMatch};

    pub enum Using {
        Regex(regex::Regex),
        Text(String),
    }
    pub enum Segment {
        /// Executes a remove instruction which removes a piece of text from the running license.
        /// 
        /// The running license is the license that is being processed by the pipeline.
        /// > The running license always starts off as the incoming license.
        Remove(Using),
        Replace(Using, String),
        Custom(fn (&str) -> String),

        /// Executes multiple segment actions before testing on the algorithm.
        Batch(Vec<Segment>),
    }
    impl Segment {
        fn execute(&self, string: &str) -> String {
            match self {
                Self::Remove(using) => match using {
                    Using::Regex(re) => re.replace_all(string, "").to_string(),
                    Using::Text(text) => string.replace(text, ""),
                },
                Self::Batch(actions) => {
                    let mut license = string.to_string();
                    for action in actions.iter() {
                        license = action.execute(&license);
                    }
                    license
                }
                Self::Replace(using, replacement) => match using {
                    Using::Regex(re) => re.replace_all(string, replacement).to_string(),
                    Using::Text(text) => string.replace(text, replacement),
                },
                Self::Custom(func) => func(string),
            }
        }
    }

    pub struct Pipeline {
        pub segments: Vec<Segment>,
    }
    impl Pipeline {
        pub fn new(segments: Vec<Segment>) -> Self {
            Self {
                segments,
                // incoming_license: String::new(),
                // current_confidence: 0.0,
            }
        }

        /// Run the pipeline on the incoming license.
        /// 
        /// # Arguments
        /// * `alg` - The algorithm to use for matching.
        /// * `incoming_license` - The license to run the pipeline on.
        /// * `desired_confidence` - The threshold at which the pipeline will stop running. 
        /// > I.e., if the confidence of ***the top (highest confidence) license*** is above this threshold, the pipeline will stop running.
        /// 
        /// > The confidence is a value between 0 and 100 (inclusive). 
        /// Any values outside of this range will be clamped to the nearest acceptable value.
        pub fn run<T>(&self, alg: &dyn LicenseListActions<T>, incoming_license: &str, desired_confidence: f32) -> Vec<LicenseMatch> {
            let desired_confidence = desired_confidence.clamp(0.0, 100.0);

            let mut piped_string = incoming_license.to_string();
            let mut alg_match_results = alg.match_by_plain_text(&piped_string);
            let mut top_match_confidence: f32 = match alg_match_results.get(0) {
                Some(top_match) => top_match.confidence,
                None => 0.0,
            }; 

            if top_match_confidence >= desired_confidence {
                return alg_match_results;
            }

            for segment in self.segments.iter() {
                piped_string = segment.execute(&piped_string);
                alg_match_results = alg.match_by_plain_text(&piped_string);

                top_match_confidence = match alg_match_results.get(0) {
                    Some(top_match) => top_match.confidence,
                    None => 0.0,
                };

                if top_match_confidence >= desired_confidence {
                    break;
                }
            }

            return alg_match_results;
        }
    }


    // impl RunnablePipelineAction for PipelineAction {

    // }
}
