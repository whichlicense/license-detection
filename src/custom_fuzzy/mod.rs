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

pub mod custom_fuzzyhash {
    pub fn create_hash(buffer: &[u8], hash_length: usize) -> i64 {
        let mut hash = 0;
        // TODO: rust has a built in hasher. maybe this is better?
        for i in 0..std::cmp::min(hash_length, buffer.len()) {
            hash = (hash << 5) - hash + buffer[i] as i64;
            hash |= 0;
        }

        hash
    }

    pub fn fuzzy_hash(input: &Vec<u8>, block_size: usize, hash_length: usize) -> Vec<i64> {
        let mut blocks = Vec::new();

        for i in (0..input.len()).step_by(block_size) {
            let block = &input[i..std::cmp::min(i + block_size, input.len())];
            let hash = create_hash(block, hash_length);
            blocks.push(hash);
        }

        blocks
    }

    pub fn calc_max_uncommon_blocks(min_confidence: f64, n_blocks: usize) -> usize {
        (n_blocks as f64 - (min_confidence * n_blocks as f64).ceil()) as usize
    }

    pub fn compare_hashes(hash1: Vec<i64>, hash2: Vec<i64>, min_confidence: f64) -> (i32, usize, f64) {
        let mut common_blocks = 0;
        let mut uncommon_blocks = 0;
        let max_blocks = std::cmp::max(hash1.len(), hash2.len());

        let max_uncommon_blocks = if min_confidence == 0.0 {
            max_blocks + max_blocks
        } else {
            calc_max_uncommon_blocks(min_confidence, max_blocks)
        };

        uncommon_blocks = (hash1.len() as i32 - hash2.len() as i32).abs() as usize;
        if uncommon_blocks > max_uncommon_blocks {
            return (-1, std::cmp::max(hash1.len(), hash2.len()), -1.0);
        }

        for i in 0..max_blocks {
            if hash1.get(i) == hash2.get(i) {
                common_blocks += 1;
            } else {
                uncommon_blocks += 1;
                if uncommon_blocks > max_uncommon_blocks {
                    return (-1, std::cmp::max(hash1.len(), hash2.len()), -1.0);
                }
            }
        }

        (
            common_blocks as i32,
            max_blocks,
            (common_blocks as f64) / std::cmp::max(hash1.len(), hash2.len()) as f64,
        )
    }
}
