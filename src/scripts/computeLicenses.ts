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

import { fuzzyHash } from "components/hashing";
import { TLicenseDBEntry } from "types/License";
import LicenseStorage from "components/storage";
import { stripLicense } from "components/minification";
import {
  TLicenseComputeOptions,
  TLicenseComputeSettingsOverride,
} from "types/LicenseCompute";

// TODO: make these props come from config file or flags
/**
 * ```BLOCK_SIZE``` is a property used to control the size of the blocks into which the input data is divided before being hashed.
 * The larger the block size, the fewer blocks will be created, and the higher the likelihood that similar files will
 * produce the same hash value.
 * A larger block size can also result in fewer permutations, making it harder to detect similarities.
 */
export const DEFAULT_BLOCK_SIZE = 10;

/**
 * ```FUZZY_HASH_LENGTH``` is a property that determines the length of the final hash value that is produced
 * by the fuzzy hashing algorithm.
 * The length of the hash is determined by the number of blocks that are processed and hashed,
 * so a larger FUZZY_HASH_LENGTH value means that more blocks will be processed, resulting in a longer, more detailed hash value.
 * This can increase the sensitivity of the algorithm, but also increase the computational cost of generating the hash.
 */
export const DEFAULT_FUZZY_HASH_LENGTH = 7;

// TODO: all defaults should come from a settings file!
export function computeLicenseHash(
  file: Uint8Array,
  blockSize = DEFAULT_BLOCK_SIZE,
  fuzzyHashLength = DEFAULT_FUZZY_HASH_LENGTH,
) {
  return {
    hash: fuzzyHash(file, blockSize, fuzzyHashLength),
    blockSize: blockSize,
    fuzzyHashLength: fuzzyHashLength,
  };
}

export function computeAllLicenseHashes(
  licensesFolderPath: string,
  options: TLicenseComputeOptions = {
    DEFAULT_BLOCK_SIZE: DEFAULT_BLOCK_SIZE,
    DEFAULT_FUZZY_HASH_LENGTH: DEFAULT_FUZZY_HASH_LENGTH,
    // TODO: make this take the object directly and also make it optional
    CTPH_SETTINGS_OVERRIDE: "./licenses/ctph_settings_override.json",
  },
) {
  const TEMP_DB: TLicenseDBEntry[] = [];
  const CTPH_SETTINGS_OVERRIDE: TLicenseComputeSettingsOverride =
    options.CTPH_SETTINGS_OVERRIDE
      ? JSON.parse(Deno.readTextFileSync(options.CTPH_SETTINGS_OVERRIDE))
      : {};

  for (const dirEntry of Deno.readDirSync(licensesFolderPath)) {
    let targetLicense: string | undefined;

    const BLOCK_SIZE = CTPH_SETTINGS_OVERRIDE[dirEntry.name]?.blockSize ||
      options.DEFAULT_BLOCK_SIZE;
    const FUZZY_HASH_LENGTH =
      CTPH_SETTINGS_OVERRIDE[dirEntry.name]?.fuzzyHashLength ||
      options.DEFAULT_FUZZY_HASH_LENGTH;

    const FILE_CONTENTS = Deno.readFileSync(`./licenses/RAW/${dirEntry.name}`);
    if (FILE_CONTENTS.length < 2) continue;

    if (CTPH_SETTINGS_OVERRIDE[dirEntry.name]) {
      targetLicense = fuzzyHash(
        FILE_CONTENTS,
        BLOCK_SIZE,
        FUZZY_HASH_LENGTH,
      );
    } else {
      targetLicense = fuzzyHash(
        FILE_CONTENTS,
        options.DEFAULT_BLOCK_SIZE,
        options.DEFAULT_FUZZY_HASH_LENGTH,
      );
    }

    TEMP_DB.push({
      name: dirEntry.name,
      hash: targetLicense,
      blockSize: BLOCK_SIZE,
      fuzzyHashLength: FUZZY_HASH_LENGTH,
    });
  }
  return TEMP_DB;
}

export function stripAndDumpLicense(folder: string) {
  for (const dirEntry of Deno.readDirSync(folder)) {
    if (dirEntry.isFile) {
      const license = stripLicense(
        Deno.readTextFileSync(`${folder}/${dirEntry.name}`).replace(
          /(---\n)(\n|.)+(---\n)/g,
          "",
        ),
      );
      if (license.length > 2) {
        Deno.writeTextFileSync(`${folder}/${dirEntry.name}`, license);
      }
    }
  }
}

if (import.meta.main) {
  const out = computeAllLicenseHashes("./licenses/RAW");
  const storage = new LicenseStorage("./licenses/ctph_hashes.wlhdb");
  storage.clear();

  for (const license of out) {
    storage.addLicense(license);
  }

  const CTPH_SETTINGS_OVERRIDE: {
    [license: string]: { blockSize?: number; fuzzyHashLength?: number };
  } = JSON.parse(
    Deno.readTextFileSync("./licenses/ctph_settings_override.json"),
  );
  console.log(`Recompiled ${Object.keys(out).length} licenses.
Total db size: ${new TextEncoder().encode(JSON.stringify(out)).length / 1e+6} MB

Default block size: ${DEFAULT_BLOCK_SIZE}
Default hash length: ${DEFAULT_FUZZY_HASH_LENGTH}

--- CTPH_SETTINGS_OVERRIDE ---
${
    Object.entries(CTPH_SETTINGS_OVERRIDE).map(([key, value]) =>
      `${key}: \n\tBlock size: ${value.blockSize}\n\tFuzzy hash length: ${value.fuzzyHashLength}`
    )
  }`);
}
