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

use whichlicense_detection::pipeline::{regex_pipeline::RegexPipeLine, PipelineTriggerInstruction, PipeLineAction, PipelineTriggerCondition, PipelineActionType, RunnablePipeLine, ConditionalPipeline, RunnablePipeLineAction};

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

#[test]
fn pipeline_trigger_action_adheres_to_its_condition(){
    let trigger_instruction_gt = PipelineTriggerInstruction {
        condition: PipelineTriggerCondition::GreaterThan,
        value: 50,
    };
    assert_eq!(trigger_instruction_gt.should_run(51), true);
    assert_eq!(trigger_instruction_gt.should_run(52), true);
    assert_eq!(trigger_instruction_gt.should_run(49), false);
    assert_eq!(trigger_instruction_gt.should_run(0), false);

    let trigger_instruction_lt = PipelineTriggerInstruction {
        condition: PipelineTriggerCondition::LessThan,
        value: 50,
    };
    assert_eq!(trigger_instruction_lt.should_run(49), true);
    assert_eq!(trigger_instruction_lt.should_run(10), true);
    assert_eq!(trigger_instruction_lt.should_run(0), true);
    assert_eq!(trigger_instruction_lt.should_run(50), false);
    assert_eq!(trigger_instruction_lt.should_run(51), false);
    assert_eq!(trigger_instruction_lt.should_run(100), false);

    let trigger_instruction_gte = PipelineTriggerInstruction {
        condition: PipelineTriggerCondition::GreaterThanOrEqual,
        value: 50,
    };
    assert_eq!(trigger_instruction_gte.should_run(50), true);
    assert_eq!(trigger_instruction_gte.should_run(51), true);
    assert_eq!(trigger_instruction_gte.should_run(100), true);
    assert_eq!(trigger_instruction_gte.should_run(49), false);
    assert_eq!(trigger_instruction_gte.should_run(0), false);


    let trigger_instruction_lte = PipelineTriggerInstruction {
        condition: PipelineTriggerCondition::LessThanOrEqual,
        value: 50,
    };
    assert_eq!(trigger_instruction_lte.should_run(50), true);
    assert_eq!(trigger_instruction_lte.should_run(49), true);
    assert_eq!(trigger_instruction_lte.should_run(0), true);
    assert_eq!(trigger_instruction_lte.should_run(51), false);
    assert_eq!(trigger_instruction_lte.should_run(100), false);

    let trigger_instruction_eq = PipelineTriggerInstruction {
        condition: PipelineTriggerCondition::Equal,
        value: 50,
    };
    assert_eq!(trigger_instruction_eq.should_run(50), true);
    assert_eq!(trigger_instruction_eq.should_run(51), false);
    assert_eq!(trigger_instruction_eq.should_run(49), false);
    assert_eq!(trigger_instruction_eq.should_run(0), false);
    assert_eq!(trigger_instruction_eq.should_run(100), false);
    

    let trigger_instruction_neq = PipelineTriggerInstruction {
        condition: PipelineTriggerCondition::NotEqual,
        value: 50,
    };
    assert_eq!(trigger_instruction_neq.should_run(49), true);
    assert_eq!(trigger_instruction_neq.should_run(51), true);
    assert_eq!(trigger_instruction_neq.should_run(0), true);
    assert_eq!(trigger_instruction_neq.should_run(100), true);
    assert_eq!(trigger_instruction_neq.should_run(50), false);

    let trigger_instruction_always = PipelineTriggerInstruction {
        condition: PipelineTriggerCondition::Always,
        value: 50,
    };
    assert_eq!(trigger_instruction_always.should_run(1), true);
    assert_eq!(trigger_instruction_always.should_run(49), true);
    assert_eq!(trigger_instruction_always.should_run(50), true);
    assert_eq!(trigger_instruction_always.should_run(100), true);
    assert_eq!(trigger_instruction_always.should_run(99), true);


}

#[test]
fn pipeline_action_modifies_correctly(){
    let action_add = PipeLineAction {
        action: PipelineActionType::Add,
        value: 5,
    };
    assert_eq!(action_add.run(10), 15);
    assert_eq!(action_add.run(0), 5);
    assert_eq!(action_add.run(100), 100);
    assert_eq!(action_add.run(255), 100);
    assert_eq!(action_add.run(200), 100);
    assert_eq!(action_add.run(95), 100);

    let action_subtract = PipeLineAction {
        action: PipelineActionType::Subtract,
        value: 5,
    };
    assert_eq!(action_subtract.run(10), 5);
    assert_eq!(action_subtract.run(5), 0);
    assert_eq!(action_subtract.run(3), 0);
    assert_eq!(action_subtract.run(1), 0);
    assert_eq!(action_subtract.run(0), 0);
    assert_eq!(action_subtract.run(255), 100);
    assert_eq!(action_subtract.run(200), 100);
    assert_eq!(action_subtract.run(105), 100);
    assert_eq!(action_subtract.run(106), 100);



    let action_set = PipeLineAction {
        action: PipelineActionType::Set,
        value: 5,
    };
    assert_eq!(action_set.run(10), 5);
    assert_eq!(action_set.run(0), 5);
    assert_eq!(action_set.run(100), 5);
    assert_eq!(action_set.run(255), 5);

    let action_set = PipeLineAction {
        action: PipelineActionType::Set,
        value: 255,
    };
    assert_eq!(action_set.run(10), 100);
    assert_eq!(action_set.run(0), 100);
    assert_eq!(action_set.run(100), 100);
    assert_eq!(action_set.run(255), 100);
}

// TODO: test pipeline action add
// TODO: test pipeline action subtract
// TODO: test pipeline action set
