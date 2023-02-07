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

import { fuzzyHash } from "../components/hashing.ts";

// TODO: make these props come from config file or flags
/**
 * ```BLOCK_SIZE``` is a property used to control the size of the blocks into which the input data is divided before being hashed.
 * The larger the block size, the fewer blocks will be created, and the higher the likelihood that similar files will
 * produce the same hash value. 
 * A larger block size can also result in fewer permutations, making it harder to detect similarities.
 */
const DEFAULT_BLOCK_SIZE = 4;

/**
 * ```FUZZY_HASH_LENGTH``` is a property that determines the length of the final hash value that is produced
 * by the fuzzy hashing algorithm.
 * The length of the hash is determined by the number of blocks that are processed and hashed, 
 * so a larger FUZZY_HASH_LENGTH value means that more blocks will be processed, resulting in a longer, more detailed hash value.
 * This can increase the sensitivity of the algorithm, but also increase the computational cost of generating the hash.
 */
const DEFAULT_FUZZY_HASH_LENGTH = 5;



// TODO: allow to only recompile 1 specific license.
// TODO: separate system to recompile on change

const TEMP_DB: Record<string, {
    hash: string,
    blockSize?: number,
    fuzzyHashLength?: number
}> = {}
const CTPH_SETTINGS_OVERRIDE: {[license: string]: {blockSize?: number, fuzzyHashLength?: number}} = JSON.parse(Deno.readTextFileSync("./licenses/ctph_settings_override.json"))

// TODO: make folder an input
for (const dirEntry of Deno.readDirSync("./licenses/RAW")) {
    let targetLicense: string | undefined;

    const BLOCK_SIZE = CTPH_SETTINGS_OVERRIDE[dirEntry.name]?.blockSize || DEFAULT_BLOCK_SIZE
    const FUZZY_HASH_LENGTH = CTPH_SETTINGS_OVERRIDE[dirEntry.name]?.fuzzyHashLength || DEFAULT_FUZZY_HASH_LENGTH
    
    if(CTPH_SETTINGS_OVERRIDE[dirEntry.name])
        targetLicense = fuzzyHash(
                Deno.readFileSync(`./licenses/RAW/${dirEntry.name}`),
                BLOCK_SIZE,
                FUZZY_HASH_LENGTH
            )
    else
        targetLicense = fuzzyHash(Deno.readFileSync(`./licenses/RAW/${dirEntry.name}`), DEFAULT_BLOCK_SIZE, DEFAULT_FUZZY_HASH_LENGTH)


    TEMP_DB[dirEntry.name] = {
        hash: targetLicense,
        // TODO: remove the props if they are the default values
        blockSize: BLOCK_SIZE,
        fuzzyHashLength: FUZZY_HASH_LENGTH
    }
}

console.log(`Recompiled ${Object.keys(TEMP_DB).length} licenses.
Total db size: ${new TextEncoder().encode(JSON.stringify(TEMP_DB)).length / 1e+6} MB

Default block size: ${DEFAULT_BLOCK_SIZE}
Default hash length: ${DEFAULT_FUZZY_HASH_LENGTH}

--- CTPH_SETTINGS_OVERRIDE ---
${Object.entries(CTPH_SETTINGS_OVERRIDE).map(([key, value]) => `${key}: \n\tBlock size: ${value.blockSize}\n\tFuzzy hash length: ${value.fuzzyHashLength}`)}

`)

Deno.writeTextFileSync("./licenses/ctph_hashes.json", JSON.stringify(TEMP_DB))

