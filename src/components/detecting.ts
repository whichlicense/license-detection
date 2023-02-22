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

import { TLicense } from "types/License";
import { compareHashes, fuzzyHash } from "components/hashing";
import LicenseStorage from "components/storage";
import { TLicenseDetectOptions } from "types/LicenseDetect";

export const LICENSE_DETECT_DEFAULTS: Required<TLicenseDetectOptions> = Object.freeze({
  minConfidenceThreshold: 0.1,
  earlyExitThreshold: 1.1,
  licenseDB: new LicenseStorage("./licenses/ctph_hashes.wlhdb"),
})

/**
 * Attempts to detect the license of the incoming license text represented as a byte array.
 * @param incomingLicense The license text, represented as a byte array
 * @returns an array of matches; empty array if no matches were found
 */
export function detectLicense(
  incomingLicense: TLicense,
  options: TLicenseDetectOptions = {},
) {
  options = {
    ...LICENSE_DETECT_DEFAULTS,
    ...options,
  }

  /**
   * Stores all the hash variations of the incoming license in a map, so we don't have to calculate them every time.
   */
  const incomingLicenseHashes = new Map<string, string>();
  const matches: (ReturnType<typeof compareHashes> & { name: string })[] = [];

  const isRawDB = options.licenseDB!.constructor === Uint8Array;

  const compareAndStore = (blockSize: number, hashLength: number, hash: string, name: string) => {
    if (!incomingLicenseHashes.has(`${blockSize}-${hashLength}`)) {
      incomingLicenseHashes.set(
        `${blockSize}-${hashLength}`,
        fuzzyHash(incomingLicense, blockSize, hashLength),
      );
    }

    const similarity = compareHashes(
      incomingLicenseHashes.get(`${blockSize}-${hashLength}`)!,
      hash,
      options.minConfidenceThreshold!,
    );

    if (similarity.confidence >= options.minConfidenceThreshold!) {
      matches.push({
        name,
        confidence: similarity.confidence,
        commonBlocks: similarity.commonBlocks,
        totalBlocks: similarity.totalBlocks,
      });
    }

    return similarity.confidence;
  }

  if(isRawDB) {
    for (
      const { blockSize, hash, hashLength, name } of LicenseStorage.parseEntry(options.licenseDB! as Uint8Array)
    ) {
      const confidence = compareAndStore(blockSize, hashLength, hash, name);
      if(confidence >= options.earlyExitThreshold!) break;
    }
  }else{
    for (const entry of options.licenseDB! as LicenseStorage) {
      // We know that this is only one entry, so we can safely destructure it here (see below).
      // > its a single entry because we don't have any batch instructions.
      const { blockSize, hash, hashLength, name } = LicenseStorage.parseEntry(
        entry,
      ).next().value!;
      const confidence = compareAndStore(blockSize, hashLength, hash, name);
      if(confidence >= options.earlyExitThreshold!) break;
    }
  }
  return matches;
}