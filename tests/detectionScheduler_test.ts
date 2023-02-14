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
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { DetectionScheduler } from "../src/components/offloading/LicenseDetection/DetectionScheduler.ts";
import LicenseStorage from "../src/components/storage.ts";
import { computeLicenseHash } from "../src/scripts/computeLicenses.ts";


// file to store fake data
const CUSTOM_LICENSE_FILE = Deno.makeTempFileSync();
// load this file to add new data to it
const LS = new LicenseStorage(CUSTOM_LICENSE_FILE)
// detection scheduler that shall have access to the custom data
const ds = new DetectionScheduler(undefined, CUSTOM_LICENSE_FILE);

const TEST_LICENSE_1 = `abc`;
const TEST_LICENSE_2 = `123`;
const TEST_LICENSE_3 = `###`;
const TEST_LICENSE_4 = `@@@`;

LS.addLicense({name: 'TEST_LICENSE_1', ...computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_1))});
LS.addLicense({name: 'TEST_LICENSE_2', ...computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_2))});
LS.addLicense({name: 'TEST_LICENSE_3', ...computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_3))});



Deno.test("Custom license database", {}, async (t) => {
    await t.step("Custom data is loaded", async () => {
      const detected = await ds.detectLicense(new TextEncoder().encode(TEST_LICENSE_1));
      assert(detected.length > 0);
      assertEquals(detected[0].name, "TEST_LICENSE_1");
    });

    await t.step("Sync works on custom data (adds new values)", async () => {
        LS.addLicense({name: 'TEST_LICENSE_4', ...computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_4))});
        ds.syncDatabase();
        const detected = await ds.detectLicense(new TextEncoder().encode(TEST_LICENSE_4));
        assert(detected.length > 0);
        assertEquals(detected[0].name, "TEST_LICENSE_4");
    });
});

// TODO: load distribution test. spam the scheduler with requests and check if load is distributed roughly evenly

addEventListener("unload", () => {
    console.log("cleaning up temp files...");
    Deno.removeSync(CUSTOM_LICENSE_FILE);
});
