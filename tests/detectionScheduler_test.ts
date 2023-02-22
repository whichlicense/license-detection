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
assertRejects,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { DetectionScheduler } from "DetectionScheduler";
import LicenseStorage from "components/storage";
import { computeLicenseHash } from "scripts/computeLicenses";

// file to store fake data
const CUSTOM_LICENSE_FILE = Deno.makeTempFileSync();
// load this file to add new data to it
const LS = new LicenseStorage(CUSTOM_LICENSE_FILE);
// detection scheduler that shall have access to the custom data
const ds = new DetectionScheduler(undefined, undefined, CUSTOM_LICENSE_FILE);

const TEST_LICENSE_1 = `abc`;
const TEST_LICENSE_2 = `123`;
const TEST_LICENSE_3 = `###`;
const TEST_LICENSE_4 = `@@@`;

LS.addLicense({
  name: "TEST_LICENSE_1",
  ...computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_1)),
});
LS.addLicense({
  name: "TEST_LICENSE_2",
  ...computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_2)),
});
LS.addLicense({
  name: "TEST_LICENSE_3",
  ...computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_3)),
});

Deno.test("Custom license database", {}, async (t) => {
  await t.step("Custom data is loaded", async () => {
    const detected = await ds.detectLicense(
      new TextEncoder().encode(TEST_LICENSE_1),
    );
    assert(detected.length > 0);
    assertEquals(detected[0].name, "TEST_LICENSE_1");
  });

  await t.step("Sync works on custom data (adds new values)", async () => {
    LS.addLicense({
      name: "TEST_LICENSE_4",
      ...computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_4)),
    });
    ds.syncDatabase();
    const detected = await ds.detectLicense(
      new TextEncoder().encode(TEST_LICENSE_4),
    );
    assert(detected.length > 0);
    assertEquals(detected[0].name, "TEST_LICENSE_4");
  });
});

Deno.test("detectLicense times-out with rejection", { sanitizeOps: false }, () => {
    const _ds = new DetectionScheduler(1, 1);

    // spam the scheduler a bit to ensure we timeout (since this thing is really fast...)
    for(let i = 0; i < 100; i++) {
      _ds.detectLicense(new TextEncoder().encode(TEST_LICENSE_1), {
        minConfidenceThreshold: 0.00001,
      });
    }

    assertRejects(() => _ds.detectLicense(new TextEncoder().encode(TEST_LICENSE_1), {
      minConfidenceThreshold: 0.00001, timeout: 0
    }))
});

// TODO: add test for early exit options. these are similar to the non-threaded early exit tests so we can copy some of those

Deno.test("DetectionScheduler load distribution is 'fair'", { sanitizeOps: false }, () => {
  const num_scheduler_threads = 3;
  /**
   * each deviation is a single license queue. so a deviation of 2 means 2 licenses in the queue
   * > The deviation is expected to grow as the number of requests increases. This increase is normal as the database is spread across multiple threads, with
   * some threads getting a section of the database which contains smaller licenses and thus less hashes to check against (faster).
   * Another point is that your OS or some other app might just be starving some of your threads.. this could also give you a uneven load distribution.
   * 
   * > **TLDR: some threads are faster than others. this is normal.**
   */
  const deviation_tolerance = 15;
  const _ds = new DetectionScheduler(num_scheduler_threads, 1);

  // spam the scheduler a bit to ensure we timeout (since this thing is really fast...)
  for(let i = 0; i < 9701; i++) {
    _ds.detectLicense(new TextEncoder().encode(TEST_LICENSE_1), { minConfidenceThreshold: 0.00001 });
  }

  const loadInfo = _ds.getLoadInfo();
  // we want the loads to be close to each other on average
  const avg = loadInfo.reduce((a, b) => a + b.load, 0) / loadInfo.length;

  for(const t of loadInfo) {
    assert(t.load >= avg - deviation_tolerance && t.load <= avg + deviation_tolerance, `load of ${t.id} (${t.load}) is outside the range ${avg-deviation_tolerance}}, ${avg+deviation_tolerance}}`)
  }
});


addEventListener("unload", () => {
  console.log("cleaning up temp files...");
  Deno.removeSync(CUSTOM_LICENSE_FILE);
});
