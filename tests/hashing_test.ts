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

import {
  assert,
  assertEquals,
  assertExists,
  assertNotEquals,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { compareHashes, createHash } from "components/hashing";

const TEST_HASH_1 = new TextEncoder().encode("1234567890");
const TEST_HASH_2 = new TextEncoder().encode("abcdefghij");

Deno.test("Creating hashes", {}, async (t) => {
  await t.step("Returns results", () => {
    const res = createHash(TEST_HASH_1, TEST_HASH_1.length);
    assertExists(res);
  });

  await t.step("Same inputs compares", () => {
    const res = createHash(TEST_HASH_1, TEST_HASH_1.length);
    assertEquals(res, createHash(TEST_HASH_1, TEST_HASH_1.length));
  });

  await t.step("Different inputs produce different hash", () => {
    const res = createHash(TEST_HASH_1, TEST_HASH_1.length);
    assertNotEquals(res, createHash(TEST_HASH_2, TEST_HASH_2.length));
  });

  await t.step("Different hash lengths produce different hash", () => {
    const res = createHash(TEST_HASH_1, TEST_HASH_1.length);
    assertNotEquals(res, createHash(TEST_HASH_1, 2));
  });
});

Deno.test("Compare hashes", {}, async (t) => {
  await t.step("Equal hash matches with high confidense", () => {
    const res = compareHashes("a:b:c:d", "a:b:c:d", 0.5);
    assert(res.confidence === 1);
  });

  await t.step("50% change produces 50% confidence", () => {
    const res = compareHashes("a:b:c:d", "a:b:x:x");
    assertEquals(res.confidence, 0.5);
  });

  await t.step("Cut off confidence tests", async (t) => {
    await t.step("Does not cut-off when above min confidence", () => {
      // should be a 50% confidence
      const res = compareHashes(
        "1:2:3:4:5:6:7:8:9:0",
        "a:b:c:d:e:6:7:8:9:0",
        0.6,
      );
      assert(res.confidence !== -1);
    });

    await t.step("Does not cut-off when exactly min confidence", () => {
      // should be a 50% confidence
      const res = compareHashes(
        "1:2:3:4:5:6:7:8:9:0",
        "a:b:c:d:e:6:7:8:9:0",
        0.5,
      );
      assert(res.confidence !== -1);
    });

    await t.step("Cuts off when below min confidence", () => {
      const res = compareHashes(
        "O:O:O:O:O:O:O:O:O:O",
        "X:X:X:X:X:X:O:O:O:O:",
        0.5,
      );
      assert(res.confidence === -1);
    });

    await t.step("No min confidence lets all through", () => {
      const res = compareHashes(
        "O:O:O:O:O:O:O:O:O:O",
        "X:X:X:X:X:X:X:X:X:X:X:X:X:X:X:X",
      );
      assert(res.confidence !== -1);
    });
  });
});
