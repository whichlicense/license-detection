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

use whichlicense_detection::{regex_pipeline::RegexPipeLine, PipelineTriggerInstruction, PipelineTriggerCondition, PipeLineAction, PipelineActionType, RunnablePipeLine};

#[test]
fn regex_pipeline_executes(){
    let regex_pipeline = RegexPipeLine {
        regex: String::from("some text"),
        license_text: String::from("this is a sample license with some text"),
        run_condition: PipelineTriggerInstruction {
            condition: PipelineTriggerCondition::GreaterThan,
            value: 50,
        },
        action: PipeLineAction {
            action: PipelineActionType::Add,
            value: 5,
        },
    };

    let result = regex_pipeline.run(95);

    assert_eq!(result, 100)
}

#[test]
fn regex_pipeline_executes_on_truthy_regex_condition(){
    let regex_pipeline = RegexPipeLine {
        regex: String::from(r"\d{4}-\d{2}-\d{2}"), // date finding regex
        license_text: String::from("this is a sample license created on 2014-01-01"),
        run_condition: PipelineTriggerInstruction {
            condition: PipelineTriggerCondition::Always,
            // does not matter on always
            value: 10,
        },
        action: PipeLineAction {
            action: PipelineActionType::Add,
            value: 5,
        },
    };

    let result = regex_pipeline.run(10);

    assert_eq!(result, 15)
}

#[test]
fn regex_pipeline_does_not_execute_on_falsy_regex_condition(){
    let regex_pipeline = RegexPipeLine {
        regex: String::from(r"\d{4}-\d{2}-\d{2}"), // date finding regex
        license_text: String::from("this is a sample license created on NO DATE"),
        run_condition: PipelineTriggerInstruction {
            condition: PipelineTriggerCondition::Always,
            // does not matter on always
            value: 10,
        },
        action: PipeLineAction {
            action: PipelineActionType::Add,
            value: 5,
        },
    };

    let result = regex_pipeline.run(10);

    assert_eq!(result, 10)
}