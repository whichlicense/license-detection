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

pub mod regex_pipeline {
    use crate::{
        ConditionalPipeline, PipeLineAction, PipelineTriggerInstruction, RunnablePipeLine,
        RunnablePipeLineAction,
    };

    /// Regex pipeline pipe which contains a regex to be matched.
    ///
    /// If the regex matches, the given PipeLineAction is executed.
    pub struct RegexPipeLine {
        /// The regex to be matched
        pub regex: String,
        /// The license text to be matched against the regex
        pub license_text: String,

        /// The condition which determines if tis pipeline should be run or not
        pub run_condition: PipelineTriggerInstruction,
        /// The action to be executed if the regex matches
        pub action: PipeLineAction,
    }

    impl RunnablePipeLine for RegexPipeLine {
        fn run(&self, confidence: u8) -> u8 {
            if self.run_condition.should_run(confidence) {
                // if regex matches, run the action
                if regex::Regex::new(&self.regex)
                    .unwrap()
                    .is_match(&self.license_text)
                {
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
