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
assert,
    assertEquals,
  } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { computeLicenseHash } from "scripts/computeLicenses";

Deno.test("computeLicenseHash test", {}, async (t) => {
    const EVEN_TEXT = "0000000000";
    const EVEN_ENCODED = new TextEncoder().encode(EVEN_TEXT)

    await t.step("blockSize 1 captures all", () => {
        const res = computeLicenseHash(EVEN_ENCODED, 1, 10);
        assertEquals(res.blockSize, 1);
        assertEquals(res.fuzzyHashLength, 10);
        assertEquals(res.hash.split(":").length, EVEN_TEXT.length);
    });

    await t.step("blockSize 2 captures in blocks of two", () => {
        const res = computeLicenseHash(EVEN_ENCODED, 2, 10);
        assertEquals(res.blockSize, 2);
        assertEquals(res.fuzzyHashLength, 10);
        assertEquals(res.hash.split(":").length, EVEN_TEXT.length / 2);
        console.log(res.hash);
    });

    await t.step("low hash length clips", () => {
        const res = computeLicenseHash(EVEN_ENCODED, 5, 1);
        assertEquals(res.blockSize, 5);
        assertEquals(res.fuzzyHashLength, 1);
        // due to the radix we use, we can't be sure of the exact length. But it should be 1 or 2.
        assert(res.hash.split(":").length <= 2);
    });
  });