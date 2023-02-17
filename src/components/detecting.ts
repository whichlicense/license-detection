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

/**
 * Attempts to detect the license of the incoming license text represented as a byte array.
 * @param incomingLicense The license text, represented as a byte array
 * @param minConfidenceThreshold The minimum confidence threshold for a match to be considered a match
 * @returns an array of matches; empty array if no matches were found
 */
export function detectLicense(
  incomingLicense: TLicense,
  licenseDB: LicenseStorage = new LicenseStorage(
    "./licenses/ctph_hashes.wlhdb",
  ),
  minConfidenceThreshold = 0.1,
  // TODO: exitAbove param that will exit the loop if the confidence is above a certain threshold
) {
  /**
   * Stores all the hash variations of the incoming license in a map, so we don't have to calculate them every time.
   */
  const incomingLicenseHashes = new Map<string, string>();
  const matches: (ReturnType<typeof compareHashes> & { name: string })[] = [];

  for (const entry of licenseDB) {
    // We know that this is only one entry, so we can safely destructure it here
    const { blockSize, hash, hashLength, name } = LicenseStorage.parseEntry(
      entry,
    ).next().value!;

    // TODO: we can extract this to a global session-based cache? no need to calculate it multiple times in a single session
    if (!incomingLicenseHashes.has(`${blockSize}-${hashLength}`)) {
      incomingLicenseHashes.set(
        `${blockSize}-${hashLength}`,
        fuzzyHash(incomingLicense, blockSize, hashLength),
      );
    }

    const similarity = compareHashes(
      incomingLicenseHashes.get(`${blockSize}-${hashLength}`)!,
      hash,
      hashLength,
    );
    if (similarity.confidence > minConfidenceThreshold) {
      matches.push({
        name,
        confidence: similarity.confidence,
        commonBlocks: similarity.commonBlocks,
        totalBlocks: similarity.totalBlocks,
      });
    }
  }

  return matches;
}

/**
 * Detects a license from a raw license database. This can be used to pass in partial databases (i.e., subsection of database).
 * @param incomingLicense The license text, represented as a byte array
 * @param confidenceThreshold The minimum confidence threshold for a match to be considered a match
 * @returns an array of matches; empty array if no matches were found
 */
export function detectLicenseRawDB(
  incomingLicense: TLicense,
  rawLicenseDB: Uint8Array,
  confidenceThreshold = 0.1,
) {
  /**
   * Stores all the hash variations of the incoming license in a map, so we don't have to calculate them every time.
   */
  const incomingLicenseHashes = new Map<string, string>();
  const matches: (ReturnType<typeof compareHashes> & { name: string })[] = [];

  // We know that this is only one entry, so we can safely destructure it here
  for (
    const { blockSize, hash, hashLength, name } of LicenseStorage.parseEntry(
      rawLicenseDB,
    )
  ) {
    // console.log(name, hash)
    // TODO: we can extract this to a global session-based cache? no need to calculate it multiple times in a single session
    if (!incomingLicenseHashes.has(`${blockSize}-${hashLength}`)) {
      incomingLicenseHashes.set(
        `${blockSize}-${hashLength}`,
        fuzzyHash(incomingLicense, blockSize, hashLength),
      );
    }

    const similarity = compareHashes(
      incomingLicenseHashes.get(`${blockSize}-${hashLength}`)!,
      hash,
      hashLength,
    );
    if (similarity.confidence > confidenceThreshold) {
      matches.push({
        name,
        confidence: similarity.confidence,
        commonBlocks: similarity.commonBlocks,
        totalBlocks: similarity.totalBlocks,
      });
    }
  }

  return matches;
}
