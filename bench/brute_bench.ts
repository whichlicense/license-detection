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

import { DetectionScheduler } from "../src/components/offloading/LicenseDetection/DetectionScheduler.ts";
import LicenseStorage from "../src/components/storage.ts";

/**
 * This will hold all brute force style benchmarks that don't really make sense (like detecting a million licenses in one go or something)
 */

/**
 * For each iteration we take a random license from a pool and attempt to detect it.
 * > deno also goes and tests the same detection code 75, 99 and 995 times respectively. 
 * ***NOTE!!: This means that the total amount of times the detection code is tested is ITERATIONS * amount of times deno ran it***
 */
const ITERATIONS = 1


const DETECTION_SCHEDULER = new DetectionScheduler()

console.log(`
Running some unreasonable benchmarks (${new Date().toISOString()}).
Data set details:
  Amount of licenses: ${new LicenseStorage('./licenses/ctph_hashes.wlhdb').getEntryCount()}
`);


const LICENSE_FILES = Array.from(Deno.readDirSync('./licenses/RAW')).map((file) => `./licenses/RAW/${file.name}`)

function randomArrItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PICKED_LICENSES = Array.from({length: ITERATIONS}, () => Deno.readFileSync(randomArrItem(LICENSE_FILES)))

function cloneByteArray(source: Uint8Array): Uint8Array {
    const ab = new ArrayBuffer(source.byteLength);
    const new_arr = new Uint8Array(ab)
    new_arr.set(new Uint8Array(source));
    return new_arr;
}

Deno.bench(
    `Threaded random license detection (${ITERATIONS} iterations)`,
    { group: "threaded_vs_nothread", },
    async () => {
      // awaiting results to make sure we measure till completion
      const promisePool = []
      for(const license of PICKED_LICENSES) {
        // send and forget..
        promisePool.push(DETECTION_SCHEDULER.detectLicense(cloneByteArray(license)))
      }

      // wait for all to finish
      await Promise.all(promisePool)
    },
);