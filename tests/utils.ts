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

import { stripLicense } from "components/minification";

export function genRandHalfModifiedLicense(length = 8000, chars = ["@", "#"]) {
  const ORIGINAL_FILE = stripLicense(chars[0].repeat(length));

  // Should generate a new string based on the original file with exactly half of the @ symbols replaced with # symbols.
  const halfOfFile = ORIGINAL_FILE.length / 2;
  function randomArrIndex<T>(arr: T[]): number {
    return Math.floor(Math.random() * arr.length);
  }
  const CHAR_SPLIT = ORIGINAL_FILE.split("");
  for (let i = 0; i < halfOfFile; i++) {
    const randomItem = randomArrIndex(CHAR_SPLIT);
    if (CHAR_SPLIT[randomItem] === chars[0]) {
      CHAR_SPLIT[randomItem] = chars[1];
    } else {
      i--;
    }
  }

  const HALF_MODIFIED_FILE = CHAR_SPLIT.join("");
  return {
    original: ORIGINAL_FILE,
    modified: HALF_MODIFIED_FILE,
  };
}
