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

pub mod diffing_pipeline {
    use crate::{
        ConditionalPipeline, PipeLineAction, PipelineTriggerInstruction, RunnablePipeLine,
        RunnablePipeLineAction,
    };

    extern crate diff;

    /// Diffing pipeline pipe which takes the contents
    ///
    /// If the regex matches, the given PipeLineAction is executed.
    pub struct DiffingPipeLine {
        /// The original license text as defined within our database
        pub original_license: String,
        /// The modified license text as fetched from the dependency
        pub modified_license: String,
        // The regex to be used in the matching of the diff between the original and modified license
        pub regex: String,

        /// The condition which determines if tis pipeline should be run or not
        pub run_condition: PipelineTriggerInstruction,
        /// The action to be executed if the regex matches
        pub action: PipeLineAction,
    }

    impl RunnablePipeLine for DiffingPipeLine {
        fn run(&self, confidence: u8) -> u8 {
            if self.run_condition.should_run(confidence) {
                let diff = diff::chars(&self.original_license, &self.modified_license);
                let mut diff_text = String::new();

                for line in diff {
                    match line {
                        diff::Result::Right(r) => {
                            diff_text.push(r);
                        }
                        _ => {}
                    }
                }

                if regex::Regex::new(&self.regex).unwrap().is_match(&diff_text) {
                    self.action.run(confidence)
                } else {
                    confidence
                }
            } else {
                confidence
            }
        }
    }
}
