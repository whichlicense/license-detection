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
/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import {
  EDetectionThreadMessageType,
  TDetectionThreadMessage,
} from "types/DetectionScheduler";
import { detectLicense } from "components/detecting";

let DB: Uint8Array = new Uint8Array();

self.onmessage = (e: MessageEvent<TDetectionThreadMessage>) => {
  if (e.data.type === EDetectionThreadMessageType.INIT) {
    DB = new Uint8Array(e.data.db);
  } else if (e.data.type === EDetectionThreadMessageType.DETECT) {
    const RAW_LICENSE = new Uint8Array(e.data.srcl); // memory is shared across threads
    const matches = detectLicense(
      RAW_LICENSE,
      {
        minConfidenceThreshold: e.data.minConfidence || 0.9,
        licenseDB: DB,
      },
    );

    const REPLY: TDetectionThreadMessage = {
      type: EDetectionThreadMessageType.RESULT,
      for: e.data.id,
      result: matches,
    };
    postMessage(REPLY);
  }
};