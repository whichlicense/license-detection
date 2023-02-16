/*
 *   Copyright (c) 2023 Duart Snel

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

import { compareHashes, fuzzyHash } from "components/hashing";
import { stripLicense } from "components/minification";


/**
 * The maximum block size to test against. The program will test all block sizes from MIN_BLOCK_SIZE to this value.
 */
const MAX_BLOCK_SIZE = 25;
const MIN_BLOCK_SIZE = 1;

/**
 * The maximum fuzzy hash length to test against. The program will test all fuzzy hash lengths from MIN_FUZZY_HASH_LENGTH to this value.
 */
const MAX_FUZZY_HASH_LENGTH = 25;
const MIN_FUZZY_HASH_LENGTH = 1;

/**
 * Indicates if we should filter out results that are exited early (based on hash comparison threshold logic)
 */
const FILTER_OUT_DNF = true;

const MIN_CONFIDENCE = 0.1;




const ORIGINAL_FILE = stripLicense("@".repeat(8000));

// Should generate a new string based on the original file with exactly half of the @ symbols replaced with # symbols.
const halfOfFile = ORIGINAL_FILE.length / 2;
function randomArrIndex<T>(arr: T[]): number {
    return Math.floor(Math.random() * arr.length);
}
const CHAR_SPLIT = ORIGINAL_FILE.split("");
for (let i = 0; i < halfOfFile; i++) {
    const randomItem = randomArrIndex(CHAR_SPLIT);
    if (CHAR_SPLIT[randomItem] === "@") {
        CHAR_SPLIT[randomItem] = "#";
    } else {
        i--;
    }
}

const HALF_MODIFIED_FILE = CHAR_SPLIT.join("");
if (ORIGINAL_FILE.length !== HALF_MODIFIED_FILE.length) {
    throw new Error(
        "The files are not the same length!. the data will be... weird...",
    );
}




for (let blockSize = MIN_BLOCK_SIZE; blockSize <= MAX_BLOCK_SIZE; blockSize++) {
    for (
        let fuzzyHashLength = MIN_FUZZY_HASH_LENGTH;
        fuzzyHashLength <= MAX_FUZZY_HASH_LENGTH;
        fuzzyHashLength++
    ) {
        const ORIGINAL_FILE_HASH = fuzzyHash(
            new TextEncoder().encode(ORIGINAL_FILE),
            blockSize,
            fuzzyHashLength,
        );
        const CHANGED_FILE_HASH = fuzzyHash(
            new TextEncoder().encode(HALF_MODIFIED_FILE),
            blockSize,
            fuzzyHashLength,
        );

        const comparingResults = compareHashes(
            ORIGINAL_FILE_HASH,
            CHANGED_FILE_HASH,
        );
        if (FILTER_OUT_DNF && comparingResults.commonBlocks === -1) continue;

        Deno.bench(
            `compareHashes [${blockSize}, ${fuzzyHashLength}] - Confidence: ${comparingResults.confidence}`,
            {
                group: "compareHashes",
            },
            () => {
                compareHashes(ORIGINAL_FILE_HASH, CHANGED_FILE_HASH, MIN_CONFIDENCE);
            },
        );
    }
}