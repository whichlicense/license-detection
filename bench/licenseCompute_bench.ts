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

import {
  computeAllLicenseHashes,
  computeLicenseHash,
  DEFAULT_BLOCK_SIZE,
  DEFAULT_FUZZY_HASH_LENGTH,
} from "../src/scripts/computeLicenses.ts";

// --- properties
const EXAMPLE_LICENSE = Deno.readFileSync("./licenses/RAW/apache-2.0.LICENSE");
/**
 * The maximum block size to test against. The program will test all block sizes from MIN_BLOCK_SIZE to this value.
 */
const MAX_BLOCK_SIZE = 10;
const MIN_BLOCK_SIZE = 2;

/**
 * The maximum fuzzy hash length to test against. The program will test all fuzzy hash lengths from MIN_FUZZY_HASH_LENGTH to this value.
 */
const MAX_FUZZY_HASH_LENGTH = 9;
const MIN_FUZZY_HASH_LENGTH = 2;

// TODO: print out time..
console.log(`
Running license hash computation benchmarks (${new Date().toISOString()}).
Legend:
  - Single license [blockSize, fuzzyHashLength] \t (e.g., Single license [64, 64])

Notes:
  - The 'Single license [...]' benchmarks has a baseline with ${DEFAULT_BLOCK_SIZE} as blockSize and ${DEFAULT_FUZZY_HASH_LENGTH} as fuzzyHashLength. This conveniently also happens to be the default values for the 'computeLicenseHash' function.
`);

// --- benchmarks
Deno.bench("Computing all license hashes", () => {
  computeAllLicenseHashes("./licenses/RAW");
});

Deno.bench(
  `Single license [${DEFAULT_BLOCK_SIZE}, ${DEFAULT_FUZZY_HASH_LENGTH}] (BASELINE)`,
  { group: "slc", baseline: true },
  () => {
    computeLicenseHash(
      EXAMPLE_LICENSE,
      DEFAULT_BLOCK_SIZE,
      DEFAULT_FUZZY_HASH_LENGTH,
    );
  },
);

for (let blockSize = MIN_BLOCK_SIZE; blockSize <= MAX_BLOCK_SIZE; blockSize++) {
  for (
    let fuzzyHashLength = MIN_FUZZY_HASH_LENGTH;
    fuzzyHashLength <= MAX_FUZZY_HASH_LENGTH;
    fuzzyHashLength++
  ) {
    Deno.bench(`Single license [${blockSize}, ${fuzzyHashLength}]`, {
      group: "slc",
    }, () => {
      computeLicenseHash(EXAMPLE_LICENSE, blockSize, fuzzyHashLength);
    });
  }
}
