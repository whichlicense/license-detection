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

import { detectLicenseRawDB } from "../components/detecting.ts";

export enum ECoordinationThreadMessageType {
  detect,
  result,
  progress,
  init,
  syncDatabase,
}

export type TDetectionResult = ReturnType<typeof detectLicenseRawDB>;

export type TCoordinationThreadMessage = {
  type: ECoordinationThreadMessageType.result;
  results: ReturnType<typeof detectLicenseRawDB>;
} | {
  type: ECoordinationThreadMessageType.progress;
  data: number;
} | {
  type: ECoordinationThreadMessageType.detect;
  license: ArrayBufferLike;
  id: string;

  /**
   * Minimum confidence required to be considered a match worthy of returning. anything below this will be ignored.
   * > This speeds up detection the higher it is set.
   */
  minConfidence: number;
} | {
  type: ECoordinationThreadMessageType.init;
  loadBuffer: SharedArrayBuffer;
  dbFilePath: string;
  nDetectionThreads?: number;
} | {
  type: ECoordinationThreadMessageType.syncDatabase;
};

export enum EDetectionThreadMessageType {
  RESULT,
  INIT,
  DETECT,
}

export type TDetectionThreadMessage = {
  type: EDetectionThreadMessageType.RESULT;
  for: string;
  result: ReturnType<typeof detectLicenseRawDB>;
} | {
  type: EDetectionThreadMessageType.INIT;

  /**
   * DB section
   */
  db: ArrayBufferLike;
} | {
  type: EDetectionThreadMessageType.DETECT;
  /**
   * Source license
   */
  srcl: SharedArrayBuffer;
  /**
   * ID of the request
   */
  id: string;
  /**
   * Minimum confidence required to be considered a match worthy of returning. anything below this will be ignored.
   * > This speeds up detection the higher it is set.
   */
  minConfidence: number;
};
