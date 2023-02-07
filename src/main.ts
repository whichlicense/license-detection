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

import { compareHashes, fuzzyHash } from "./components/hashing.ts";
import { stripLicense } from "./components/minification.ts";

import licenses from "../licenses/hashes.json" assert { type: "json" };

/**
 * ```BLOCK_SIZE``` is a property used to control the size of the blocks into which the input data is divided before being hashed.
 * The larger the block size, the fewer blocks will be created, and the higher the likelihood that similar files will
 * produce the same hash value. 
 * A larger block size can also result in fewer permutations, making it harder to detect similarities.
 */
const BLOCK_SIZE = 4;

/**
 * ```FUZZY_HASH_LENGTH``` is a property that determines the length of the final hash value that is produced
 * by the fuzzy hashing algorithm.
 * The length of the hash is determined by the number of blocks that are processed and hashed, 
 * so a larger FUZZY_HASH_LENGTH value means that more blocks will be processed, resulting in a longer, more detailed hash value.
 * This can increase the sensitivity of the algorithm, but also increase the computational cost of generating the hash.
 */
const FUZZY_HASH_LENGTH = 5;



// TODO: this will not work because we have no idea what the license is called when it comes in!
const CTPH_SETTINGS_OVERRIDE: {[license: string]: {blockSize?: number, fuzzyHashLength?: number}} = JSON.parse(Deno.readTextFileSync("./licenses/ctph_settings_override.json"))



const sourceLicense = fuzzyHash(new TextEncoder().encode(stripLicense(Deno.readTextFileSync('./LICENSE'))), BLOCK_SIZE, FUZZY_HASH_LENGTH)

const matches: (ReturnType<typeof compareHashes> & {name: string})[] = [];

for(const entry in licenses){
    const license: keyof typeof licenses = entry as keyof typeof licenses;
    
    const similarity = compareHashes(sourceLicense, licenses[license])
    if(similarity.confidence > 0.4){
      matches.push({
        name: entry,
        confidence: similarity.confidence,
        commonBlocks: similarity.commonBlocks,
        totalBlocks: similarity.totalBlocks
      });
    }
}





// just printing out for testing
const bestMatch = matches.sort((a, b) => b.confidence - a.confidence);
console.log(`Found ${matches.length} matches.
The best match is ${bestMatch[0].name} with a confidence of ${Math.min(100, bestMatch[0].confidence*100)}%

All matches (ranked):
${matches
  .map(match => `${Math.min(100, (match.confidence*100)).toFixed(2)}% - ${match.name} \t Common blocks: ${match.commonBlocks}/${match.totalBlocks}`)
  .join('\n')
}
`)
