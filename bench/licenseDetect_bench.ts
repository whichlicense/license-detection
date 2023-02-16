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

import { detectLicense } from "components/detecting";
import { stripLicense } from "components/minification";
import { DetectionScheduler } from "DetectionScheduler";
import LicenseStorage from "components/storage";
import {
  computeAllLicenseHashes,
  computeLicenseHash,
  DEFAULT_BLOCK_SIZE,
  DEFAULT_FUZZY_HASH_LENGTH,
} from "scripts/computeLicenses";
import { genRandHalfModifiedLicense } from "../tests/utils.ts";

// --- properties

const _DB_FILE_COPY = Deno.makeTempFileSync();
Deno.copyFileSync("./licenses/ctph_hashes.wlhdb", _DB_FILE_COPY)

const _EXAMPLE_LICENSES = genRandHalfModifiedLicense()
const EXAMPLE_DB = new LicenseStorage(_DB_FILE_COPY);
EXAMPLE_DB.addLicense({
  name: "TESTING LICENSE",
  hash: computeLicenseHash(new TextEncoder().encode(_EXAMPLE_LICENSES.original), DEFAULT_BLOCK_SIZE, DEFAULT_FUZZY_HASH_LENGTH).hash,
  blockSize: DEFAULT_BLOCK_SIZE,
  fuzzyHashLength: DEFAULT_FUZZY_HASH_LENGTH,
})

const EXAMPLE_LICENSE = new TextEncoder().encode(_EXAMPLE_LICENSES.modified)

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

const CONFIDENCE = 0.1;

// To simulate a real-world scenario, we'll create this ahead of time.
const DETECTION_SCHEDULER = new DetectionScheduler(undefined, _DB_FILE_COPY);

function cloneByteArray(source: Uint8Array): Uint8Array {
  const ab = new ArrayBuffer(source.byteLength);
  const new_arr = new Uint8Array(ab);
  new_arr.set(new Uint8Array(source));
  return new_arr;
}

console.log(`
Running license detection benchmarks (${new Date().toISOString()}).
Anything below ${CONFIDENCE} confidence will not show within these benchmarks (min threshold).
Default data set details:
  Amount of licenses: ${
  new LicenseStorage("./licenses/ctph_hashes.wlhdb").getEntryCount()
}

Legend:
  - detectLicense [blockSize, fuzzyHashLength] \t (e.g., Single license [64, 64])

Notes:
  - The 'detectLicense [...]' benchmarks has a baseline with ${DEFAULT_BLOCK_SIZE} as blockSize and ${DEFAULT_FUZZY_HASH_LENGTH} as fuzzyHashLength. This conveniently also happens to be the default values for the 'computeLicenseHash' function.
  - The license used for detection is added at the very end of the database.
  - The license used for detection has exactly 50% of its content modified (in random places) from the original license.
    - i.e., this means that the confidence value should be 0.5 (or 50%). or different depending on what one wants to achieve with the fuzzy hashing system
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

Deno.bench("Single threaded non existent license", () => {
  detectLicense(NO_EX_LICENSE, EXAMPLE_DB, CONFIDENCE);
});

Deno.bench(
  `(BASELINE) Non threaded detection [${DEFAULT_BLOCK_SIZE}, ${DEFAULT_FUZZY_HASH_LENGTH}]`,
  { group: "threaded_vs_nothread", baseline: true },
  () => {
    detectLicense(cloneByteArray(EXAMPLE_LICENSE), EXAMPLE_DB, CONFIDENCE);
  },
);

Deno.bench(
  `Threaded detection [${DEFAULT_BLOCK_SIZE}, ${DEFAULT_FUZZY_HASH_LENGTH}]`,
  { group: "threaded_vs_nothread" },
  async () => {
    // awaiting results to make sure we measure till completion
    await DETECTION_SCHEDULER.detectLicense(cloneByteArray(EXAMPLE_LICENSE), CONFIDENCE);
  },
);

const conf: number | undefined = detectLicense(EXAMPLE_LICENSE, undefined, CONFIDENCE)[0]?.confidence;
Deno.bench(
  `detectLicense [${DEFAULT_BLOCK_SIZE}, ${DEFAULT_FUZZY_HASH_LENGTH}] (BASELINE) - Confidence: ${conf || 'no results'}`,
  { group: "sld", baseline: true },
  () => {
    detectLicense(EXAMPLE_LICENSE, EXAMPLE_DB, CONFIDENCE);
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

    const storage = new LicenseStorage(TMEP_FILE_ENTRY);
    for (const license of ADJUSTED_LICENSE_DB) {
      storage.addLicense(license);
    }
    storage.addLicense({
      name: "TESTING LICENSE",
      hash: computeLicenseHash(new TextEncoder().encode(_EXAMPLE_LICENSES.original), blockSize, fuzzyHashLength).hash,
      blockSize: blockSize,
      fuzzyHashLength: fuzzyHashLength,
    })

    tempFiles.push(TMEP_FILE_ENTRY);
  }
}

for (const file of tempFiles) {
  const [blockSize, fuzzyHashLength] = file.split("_").slice(1);
  const storageSys = new LicenseStorage(file);
  const conf: number | undefined = detectLicense(EXAMPLE_LICENSE, storageSys, CONFIDENCE)[0]?.confidence;
  Deno.bench(`detectLicense [${blockSize}, ${fuzzyHashLength}] - Confidence: ${conf || 'no results'}`, {
    group: "sld",
  }, () => {
    detectLicense(EXAMPLE_LICENSE, storageSys, CONFIDENCE);
  });
}

// TODO: detect difference between first license and last license (can be used to build up a big O notation)

addEventListener("unload", () => {
  console.log("cleaning up temp files...");
  for (const file of tempFiles) {
    Deno.removeSync(file);
  }
  Deno.removeSync(_DB_FILE_COPY)
});