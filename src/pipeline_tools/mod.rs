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

pub mod diffing_pipeline;
pub mod regex_pipeline;

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
}
