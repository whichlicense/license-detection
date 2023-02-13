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

import { assert } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { compareHashes } from "../src/components/hashing.ts";

Deno.test("Compare hashes", {}, async (t) => {
  await t.step("Equal hash matches with high confidense", () => {
    const res = compareHashes("abcd", "abcd", 2, 0.5);
    assert(res.confidence === 1);
  });

  await t.step("50% change produces 50% confidence", () => {
    const res = compareHashes("abcd", "abxx", 2, 0.1);
    assert(res.confidence === 0.5);
  });

  await t.step("Cut off confidence tests", async (t) => {
    await t.step("Does not cut-off when above min confidence", () => {
      // should be a 50% confidence
      const res = compareHashes("1234567890", "abcde67890", 1, 0.6);
      assert(res.confidence !== -1);
    });

    await t.step("Does not cut-off when exactly min confidence", () => {
      // should be a 50% confidence
      const res = compareHashes("1234567890", "abcde67890", 1, 0.5);
      assert(res.confidence !== -1);
    });

    await t.step("Cuts off when below min confidence", () => {
      // should be a 50% confidence
      const res = compareHashes("OOOOOOOOOO", "XXXXXXOOOO", 1, 0.5);
      assert(res.confidence === -1);
    });

    await t.step("No min confidence lets all through", () => {
      // should be a 50% confidence
      const res = compareHashes("OOOOOOOOOO", "XXXXXXXXXXXXXXXX", 1);
      assert(res.confidence !== -1);
    });
  });
});
