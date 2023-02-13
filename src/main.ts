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

import LicenseStorage from "components/storage";
export { LicenseStorage };

export { DetectionScheduler } from "DetectionScheduler";
export { detectLicense, detectLicenseRawDB } from "components/detecting";
export { compareHashes, createHash, fuzzyHash } from "components/hashing";
export { stripLicense } from "components/minification";

export {
  computeAllLicenseHashes,
  computeLicenseHash,
  DEFAULT_BLOCK_SIZE,
  DEFAULT_FUZZY_HASH_LENGTH,
  stripAndDumpLicense,
} from "scripts/computeLicenses";

export type {
  ECoordinationThreadMessageType,
  EDetectionThreadMessageType,
  TCoordinationThreadMessage,
  TDetectionResult,
  TDetectionThreadMessage,
} from "types/DetectionScheduler";

export type { TLicense, TLicenseDBEntry } from "types/License";

export type {
  TLicenseComputeOptions,
  TLicenseComputeSettingsOverride,
} from "types/LicenseCompute";
