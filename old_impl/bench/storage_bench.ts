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

import LicenseStorage from "components/storage";

const storage = new LicenseStorage("./licenses/ctph_hashes.wlhdb");

let i = 0;

console.log(`Running benchmarks for LicenseStorage
  Amount of licenses: ${storage.getEntryCount()}
`);

Deno.bench(
  `LicenseStorage base iterator (BASELINE)`,
  { group: "iteration", baseline: true },
  () => {
    for (const _entry of storage) i++;
  },
);

Deno.bench(
  `LicenseStorage batch 2 iterator`,
  { group: "iteration" },
  () => {
    for (const _entry of storage.entriesBatched(2)) i++;
  },
);

Deno.bench(
  `LicenseStorage batch 20 iterator`,
  { group: "iteration" },
  () => {
    for (const _entry of storage.entriesBatched(20)) i++;
  },
);

Deno.bench(
  `LicenseStorage batch (200) iterator []`,
  { group: "iteration" },
  () => {
    for (const _entry of storage.entriesBatched(200)) i++;
  },
);
