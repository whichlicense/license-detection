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
  fail,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { compareHashes } from "../src/components/hashing.ts";
import { stripLicense } from "../src/components/minification.ts";
import LicenseStorage from "../src/components/storage.ts";
import { computeLicenseHash } from "../src/scripts/computeLicenses.ts";

const NEEDS_CLEANUP: string[] = [];

Deno.test("Empty storage tests", {}, async (t) => {
  const EMPTY_TEST_FILE = Deno.makeTempFileSync({
    prefix: "license_storage_test_",
  });
  NEEDS_CLEANUP.push(EMPTY_TEST_FILE);
  const EMPTY_STORAGE = new LicenseStorage(EMPTY_TEST_FILE);

  await t.step("Should have 0 entries", () => {
    assertEquals(EMPTY_STORAGE.getEntryCount(), 0);
  });

  await t.step("Clearing keeps heading", () => {
    EMPTY_STORAGE.clear();
    assertEquals(EMPTY_STORAGE.getEntryCount(), 0);
  });

  await t.step("Adding a license increments entry", () => {
    EMPTY_STORAGE.addLicense({
      name: "APACHE-2.0",
      hash: computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_1), 10, 7)
        .hash,
      blockSize: 10,
      fuzzyHashLength: 7,
    });
    assertEquals(EMPTY_STORAGE.getEntryCount(), 1);
  });

  EMPTY_STORAGE.closeDB();
});

Deno.test("Populated storage tests", {}, async (t) => {
  const TEST_FILE = Deno.makeTempFileSync({ prefix: "license_storage_test_" });
  NEEDS_CLEANUP.push(TEST_FILE);
  const STORAGE = new LicenseStorage(TEST_FILE);

  STORAGE.addLicense({
    name: "TEST_1",
    hash:
      computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_1), 10, 7).hash,
    blockSize: 10,
    fuzzyHashLength: 7,
  });

  STORAGE.addLicense({
    name: "TEST_2",
    hash:
      computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_2), 10, 7).hash,
    blockSize: 10,
    fuzzyHashLength: 7,
  });

  STORAGE.addLicense({
    name: "TEST_3",
    hash:
      computeLicenseHash(new TextEncoder().encode(TEST_LICENSE_3), 10, 7).hash,
    blockSize: 10,
    fuzzyHashLength: 7,
  });

  await t.step("Entries (symbol iterator) works", () => {
    for (const entry of STORAGE.entries()) {
      assert(entry && entry.length > 0);
    }
  });
  await t.step("parseEntry works", () => {
    let i = 0;
    for (const entry of STORAGE.entries()) {
      const parsed = LicenseStorage.parseEntry(entry).next().value;
      assertExists(parsed);
      assertEquals(parsed!.name, `TEST_${i + 1}`);
      assertEquals(parsed!.blockSize, 10);
      assertEquals(parsed!.hashLength, 7);
      assertEquals(
        parsed!.hash,
        computeLicenseHash(
          new TextEncoder().encode(TEST_LICENSE_MAP[`TEST_LICENSE_${i + 1}`]),
          10,
          7,
        ).hash,
      );
      i++;
    }
  });
  await t.step("Batched entries works", () => {
    let i = 0;
    for (const entry of STORAGE.entriesBatched(2)) {
      if (i == 0) {
        const parsedEntries = LicenseStorage.parseEntry(entry);
        const parsed1 = parsedEntries.next().value;
        const parsed2 = parsedEntries.next().value;

        assertExists(parsed1);
        assertEquals(parsed1?.name, `TEST_1`);
        assertEquals(parsed1!.blockSize, 10);
        assertEquals(parsed1!.hashLength, 7);
        assertEquals(
          parsed1!.hash,
          computeLicenseHash(
            new TextEncoder().encode(TEST_LICENSE_MAP[`TEST_LICENSE_1`]),
            10,
            7,
          ).hash,
        );
        assertEquals(
          compareHashes(
            parsed1!.hash,
            computeLicenseHash(
              new TextEncoder().encode(TEST_LICENSE_MAP[`TEST_LICENSE_1`]),
              10,
              7,
            ).hash,
          ).confidence,
          1,
        );

        assertExists(parsed2);
        assertEquals(parsed2?.name, `TEST_2`);
        assertEquals(parsed2!.blockSize, 10);
        assertEquals(parsed2!.hashLength, 7);
        assertEquals(
          parsed2!.hash,
          computeLicenseHash(
            new TextEncoder().encode(TEST_LICENSE_MAP[`TEST_LICENSE_2`]),
            10,
            7,
          ).hash,
        );
        assertEquals(
          compareHashes(
            parsed2!.hash,
            computeLicenseHash(
              new TextEncoder().encode(TEST_LICENSE_MAP[`TEST_LICENSE_2`]),
              10,
              7,
            ).hash,
          ).confidence,
          1,
        );
      } else if (i == 1) {
        const parsed3 = LicenseStorage.parseEntry(entry).next().value;
        assertExists(parsed3);
        assertEquals(parsed3?.name, `TEST_3`);
        assertEquals(parsed3!.blockSize, 10);
        assertEquals(parsed3!.hashLength, 7);
        assertEquals(
          parsed3!.hash,
          computeLicenseHash(
            new TextEncoder().encode(TEST_LICENSE_MAP[`TEST_LICENSE_3`]),
            10,
            7,
          ).hash,
        );
        assertEquals(
          compareHashes(
            parsed3!.hash,
            computeLicenseHash(
              new TextEncoder().encode(TEST_LICENSE_MAP[`TEST_LICENSE_3`]),
              10,
              7,
            ).hash,
          ).confidence,
          1,
        );
      } else {
        fail("Too many entries?.. check test code.");
      }
      i++;
    }
  });

  STORAGE.closeDB();
});

addEventListener("unload", () => {
  console.log("cleaning up temp files...");
  for (const file of NEEDS_CLEANUP) {
    Deno.removeSync(file);
  }
});

const TEST_LICENSE_1 = stripLicense(Deno.readTextFileSync("./LICENSE"));
const TEST_LICENSE_2 =
  `Permissionisherebygranted,freeofcharge,toanypersonobtainingacopyofthissoftwareandassociateddocumentationfiles(the"Software"),todealintheSoftwarewithoutrestriction,includingwithoutlimitationtherightstouse,copy,modify,merge,publish,distribute,sublicense,and/orsellcopiesoftheSoftware,andtopermitpersonstowhomtheSoftwareisfurnishedtodoso,subjecttothefollowingconditions:TheabovecopyrightnoticeandthispermissionnoticeshallbeincludedinallcopiesorsubstantialportionsoftheSoftware.THESOFTWAREISPROVIDED"ASIS",WITHOUTWARRANTYOFANYKIND,EXPRESSORIMPLIED,INCLUDINGBUTNOTLIMITEDTOTHEWARRANTIESOFMERCHANTABILITY,FITNESSFORAPARTICULARPURPOSEANDNONINFRINGEMENT.INNOEVENTSHALLTHEAUTHORSORCOPYRIGHTHOLDERSBELIABLEFORANYCLAIM,DAMAGESOROTHERLIABILITY,WHETHERINANACTIONOFCONTRACT,TORTOROTHERWISE,ARISINGFROM,OUTOFORINCONNECTIONWITHTHESOFTWAREORTHEUSEOROTHERDEALINGSINTHESOFTWARE.`;
const TEST_LICENSE_3 =
  `Redistributionanduseinsourceandbinaryforms,withorwithoutmodification,arepermittedprovidedthatthefollowingconditionsaremet:1.Redistributionsofsourcecodemustretaintheabovecopyrightnotice,thislistofconditionsandthefollowingdisclaimer.2.Redistributionsinbinaryformmustreproducetheabovecopyrightnotice,thislistofconditionsandthefollowingdisclaimerinthedocumentationand/orothermaterialsprovidedwiththedistribution.3.Neitherthenameofthecopyrightholder(s)northenamesofanycontributorsmaybeusedtoendorseorpromoteproductsderivedfromthissoftwarewithoutspecificpriorwrittenpermission.Nolicenseisgrantedtothetrademarksofthecopyrightholdersevenifsuchmarksareincludedinthissoftware.THISSOFTWAREISPROVIDEDBYTHECOPYRIGHTHOLDERSANDCONTRIBUTORS"ASIS"ANDANYEXPRESSORIMPLIEDWARRANTIES,INCLUDING,BUTNOTLIMITEDTO,THEIMPLIEDWARRANTIESOFMERCHANTABILITYANDFITNESSFORAPARTICULARPURPOSEAREDISCLAIMED.INNOEVENTSHALLTHECOPYRIGHTOWNERORCONTRIBUTORSBELIABLEFORANYDIRECT,INDIRECT,INCIDENTAL,SPECIAL,EXEMPLARY,ORCONSEQUENTIALDAMAGES(INCLUDING,BUTNOTLIMITEDTO,PROCUREMENTOFSUBSTITUTEGOODSORSERVICES;LOSSOFUSE,DATA,ORPROFITS;ORBUSINESSINTERRUPTION)HOWEVERCAUSEDANDONANYTHEORYOFLIABILITY,WHETHERINCONTRACT,STRICTLIABILITY,ORTORT(INCLUDINGNEGLIGENCEOROTHERWISE)ARISINGINANYWAYOUTOFTHEUSEOFTHISSOFTWARE,EVENIFADVISEDOFTHEPOSSIBILITYOFSUCHDAMAGE.`;
const TEST_LICENSE_MAP: Record<string, string> = {
  "TEST_LICENSE_1": TEST_LICENSE_1,
  "TEST_LICENSE_2": TEST_LICENSE_2,
  "TEST_LICENSE_3": TEST_LICENSE_3,
};
