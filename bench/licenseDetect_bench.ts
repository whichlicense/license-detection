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

// TODO: finish this when detecting.ts is finished

import { detectLicense } from "../src/components/detecting.ts";
import { stripLicense } from "../src/components/minification.ts";
import {
  computeAllLicenseHashes,
  DEFAULT_BLOCK_SIZE,
  DEFAULT_FUZZY_HASH_LENGTH,
} from "../src/scripts/computeLicenses.ts";

// --- properties
const EXAMPLE_LICENSE = Deno.readFileSync("./licenses/RAW/Apache-2.0.txt");
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

const CONFIDENCE = 0.5;

console.log(`
Running license detection benchmarks.
Legend:
  - Single license [blockSize, fuzzyHashLength] \t (e.g., Single license [64, 64])

Notes:
  - The 'Single license [...]' benchmarks has a baseline with ${DEFAULT_BLOCK_SIZE} as blockSize and ${DEFAULT_FUZZY_HASH_LENGTH} as fuzzyHashLength. This conveniently also happens to be the default values for the 'computeLicenseHash' function.
`);

// --- benchmarks
const NO_EX_LICENSE = new TextEncoder().encode(
  stripLicense(
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean faucibus velit vitae felis aliquam, et pulvinar nunc molestie. Sed malesuada tristique augue, in efficitur turpis consectetur at. Nulla eu consequat nulla, id gravida elit. Suspendisse potenti. Nulla facilisi. Nunc tempus fermentum ipsum, a hendrerit massa aliquet eu. Mauris quis dignissim libero. Vivamus neque orci, consectetur eu tortor ac, suscipit accumsan dolor. Maecenas augue metus, luctus et accumsan ac, lacinia in mauris.
    Nullam dapibus, orci nec iaculis lobortis, velit velit convallis orci, et ultrices nibh magna ut lacus. Nullam aliquet lacinia metus, faucibus malesuada erat placerat sit amet. Maecenas bibendum, magna vitae congue dignissim, mi diam cursus neque, eu ornare lectus mi eget est. Curabitur viverra, enim laoreet convallis pretium, ex turpis imperdiet lectus, quis commodo ipsum ex et nibh. Vivamus at congue dui. Fusce laoreet suscipit pharetra. Curabitur aliquam placerat euismod. Etiam cursus sem non quam pharetra mollis. Vestibulum ornare diam vitae blandit aliquam. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Proin metus magna, auctor non facilisis vel, aliquet elementum nulla. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
    Maecenas enim metus, vestibulum in molestie et, tempor non elit. Praesent et lorem et mi commodo mollis quis ut leo. Donec eu ex et tortor suscipit vestibulum. Aenean gravida ornare nisl a scelerisque. In at interdum eros, non faucibus lorem. Nulla facilisi. Integer condimentum blandit euismod. Ut pellentesque lacus est, sit amet egestas elit fringilla viverra. Donec ac metus velit. Nam consequat vulputate massa, sed interdum quam. Aliquam eget tincidunt urna.
    Donec vel purus nibh. Aenean in dui nec elit tincidunt finibus vel nec erat. Sed sollicitudin sapien nec neque semper gravida non ut erat. Cras vitae lacinia enim. Ut pharetra, lacus sed cursus porttitor, sapien lacus interdum neque, sit amet tincidunt felis orci vel turpis. Sed dui sem, posuere vel purus pulvinar, maximus ullamcorper est. Nulla cursus placerat laoreet. Aliquam et dui eu tortor lacinia posuere vel at nulla. Etiam sit amet ante nec risus scelerisque cursus. Maecenas rutrum massa id risus mattis fermentum. Nunc vulputate eros urna, nec suscipit purus faucibus aliquet. Ut hendrerit at mi a eleifend. Phasellus vel quam non dui suscipit gravida. Curabitur interdum eget libero ut faucibus.
    Integer hendrerit eros non lorem lobortis, at lobortis mi porta. Vestibulum ut interdum erat. Pellentesque placerat vitae magna a ullamcorper. Curabitur malesuada neque at sem tristique accumsan a eu risus. In mollis enim vel magna lacinia, sed gravida neque vestibulum. Sed in risus non tellus imperdiet auctor quis vitae sem. Aenean auctor eu odio eu ornare. In quis massa lorem. Aliquam laoreet ipsum dolor, ut dapibus urna luctus nec. Mauris eu consectetur dolor, ut laoreet eros. Fusce augue dolor, fringilla sit amet ligula at, posuere bibendum nisl. Vestibulum mollis magna quis ligula rutrum, nec finibus ligula sagittis. In tempor sapien at ipsum bibendum, eu consequat velit varius. Nam auctor blandit condimentum. Nunc tristique viverra orci, et sollicitudin neque sodales ac.`,
  ),
);

Deno.bench("Non existent license", () => {
  detectLicense(NO_EX_LICENSE, undefined, CONFIDENCE);
});

Deno.bench(
  `Single license [${DEFAULT_BLOCK_SIZE}, ${DEFAULT_FUZZY_HASH_LENGTH}] (BASELINE)`,
  { group: "sld", baseline: true },
  () => {
    detectLicense(EXAMPLE_LICENSE, undefined, CONFIDENCE);
  },
);

const tempFiles: string[] = [];
for (let blockSize = MIN_BLOCK_SIZE; blockSize <= MAX_BLOCK_SIZE; blockSize++) {
  for (
    let fuzzyHashLength = MIN_FUZZY_HASH_LENGTH;
    fuzzyHashLength <= MAX_FUZZY_HASH_LENGTH;
    fuzzyHashLength++
  ) {
    // the new license DB adjusted with the bench cases constructed by the above loops
    const ADJUSTED_LICENSE_DB = computeAllLicenseHashes("./licenses/RAW", {
      DEFAULT_BLOCK_SIZE: blockSize,
      DEFAULT_FUZZY_HASH_LENGTH: fuzzyHashLength,
    });

    const TMEP_FILE_ENTRY = Deno.makeTempFileSync({
      prefix: `license_${blockSize}_${fuzzyHashLength}_`,
    });

    Deno.writeTextFileSync(
      TMEP_FILE_ENTRY,
      JSON.stringify(ADJUSTED_LICENSE_DB),
    );
    tempFiles.push(TMEP_FILE_ENTRY);
  }
}

for (const file of tempFiles) {
  const [blockSize, fuzzyHashLength] = file.split("_").slice(1);
  const temp = JSON.parse(Deno.readTextFileSync(file));
  Deno.bench(`Single license [${blockSize}, ${fuzzyHashLength}]`, {
    group: "sld",
  }, () => {
    detectLicense(EXAMPLE_LICENSE, temp, CONFIDENCE);
  });
}

// for(let blockSize = MIN_BLOCK_SIZE; blockSize <= MAX_BLOCK_SIZE; blockSize++){
//     for(let fuzzyHashLength = MIN_FUZZY_HASH_LENGTH; fuzzyHashLength <= MAX_FUZZY_HASH_LENGTH; fuzzyHashLength++){
//     // the new license DB adjusted with the bench cases constructed by the above loops
//     const ADJUSTED_LICENSE_DB = computeAllLicenseHashes('./licenses/RAW', {
//         DEFAULT_BLOCK_SIZE: blockSize,
//         DEFAULT_FUZZY_HASH_LENGTH: fuzzyHashLength,
//     });
//     // ensure re-computation is not included in the benchmark, thats a different bench case
//     Deno.bench(`Single license [${blockSize}, ${fuzzyHashLength}]`, {group: 'sld'}, () => {
//         detectLicense(EXAMPLE_LICENSE, ADJUSTED_LICENSE_DB, CONFIDENCE);
//     });
//   }
// }

addEventListener("unload", () => {
  console.log("cleaning up temp files...");
  for (const file of tempFiles) {
    Deno.removeSync(file);
  }
});
