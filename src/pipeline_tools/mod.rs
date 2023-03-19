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
    pub enum PipelineTriggerCondition {
        GreaterThan,
        LessThan,
        GreaterThanOrEqual,
        LessThanOrEqual,
        Equal,
        NotEqual,
        /// Always runs the pipe regardless of the confidence
        Always,
    }
    pub trait ConditionalPipeline {
        /// Returns true if the given pipe should be run
        ///
        /// The confidence parameter is the confidence of the previous pipe or, if this is the initial pipe,
        /// the confidence of the license detection results.
        fn should_run(&self, confidence: u8) -> bool;
    }

    /// The trigger indicates based on its properties if the given pipe should be run or not.
    ///
    /// The formula is: ```should_run``` = ```C``` ```condition``` ```V```
    ///
    /// where condition is one of: >, <, >=, <=, =, !=
    ///
    /// - ```C``` represents the confidence
    /// - ```V``` represents the value
    /// - ```should_run``` is a boolean which determines if the given pipe should be run or not
    pub struct PipelineTriggerInstruction {
        pub condition: PipelineTriggerCondition,
        pub value: u8,
    }

    pub enum PipelineActionType {
        Add,
        Subtract,
        Set,
    }
    pub struct PipeLineAction {
        pub action: PipelineActionType,
        pub value: u8,
    }
    pub trait RunnablePipeLineAction {
        fn run(&self, confidence: u8) -> u8;
    }
    impl RunnablePipeLineAction for PipeLineAction {
        /// Runs the given action on the given confidence
        /// and returns the new confidence.
        fn run(&self, confidence: u8) -> u8 {
            match self.action {
                PipelineActionType::Add => {
                    // clamp the confidence to 0-100
                    let res = confidence.saturating_add(self.value);
                    match res {
                        0..=100 => res,
                        101..=u8::MAX => 100,
                    }
                }
                PipelineActionType::Subtract => {
                    let res = confidence.saturating_sub(self.value);
                    match res {
                        0..=100 => res,
                        101..=u8::MAX => 100,
                    }
                }
                PipelineActionType::Set => match self.value {
                    0..=100 => self.value,
                    101..=u8::MAX => 100,
                },
            }
        }
    }

    impl ConditionalPipeline for PipelineTriggerInstruction {
        fn should_run(&self, confidence: u8) -> bool {
            match self.condition {
                PipelineTriggerCondition::GreaterThan => confidence > self.value,
                PipelineTriggerCondition::LessThan => confidence < self.value,
                PipelineTriggerCondition::GreaterThanOrEqual => confidence >= self.value,
                PipelineTriggerCondition::LessThanOrEqual => confidence <= self.value,
                PipelineTriggerCondition::Equal => confidence == self.value,
                PipelineTriggerCondition::NotEqual => confidence != self.value,
                PipelineTriggerCondition::Always => true,
            }
        }
    }

    pub trait RunnablePipeLine {
        fn run(&self, confidence: u8) -> u8;
    }

    pub mod regex_pipeline {
        use super::{ConditionalPipeline, RunnablePipeLineAction};

        /// Regex pipeline pipe which contains a regex to be matched.
        ///
        /// If the regex matches, the given PipeLineAction is executed.
        pub struct RegexPipeLine {
            /// The regex to be matched
            pub regex: String,
            /// The license text to be matched against the regex
            pub license_text: String,

            /// The condition which determines if tis pipeline should be run or not
            pub run_condition: super::PipelineTriggerInstruction,
            /// The action to be executed if the regex matches
            pub action: super::PipeLineAction,
        }

        impl super::RunnablePipeLine for RegexPipeLine {
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

    pub mod diffing_pipeline {
        use super::{ConditionalPipeline, RunnablePipeLineAction};
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
            pub run_condition: super::PipelineTriggerInstruction,
            /// The action to be executed if the regex matches
            pub action: super::PipeLineAction,
        }

        impl super::RunnablePipeLine for DiffingPipeLine {
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
}
