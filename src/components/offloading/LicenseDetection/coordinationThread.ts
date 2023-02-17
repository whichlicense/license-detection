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
  ECoordinationThreadMessageType,
  EDetectionThreadMessageType,
  TCoordinationThreadMessage,
  TDetectionResult,
  TDetectionThreadMessage,
} from "types/DetectionScheduler";
import LicenseStorage from "components/storage";

let detectionThreads: Array<Worker> = [];
const DETECTIONS = new Map<string, {
  results: Array<TDetectionResult>;
}>();

let LOAD_BUFFER: DataView | undefined;
const detectionThreadRef =
  new URL("./detectionThread.ts", import.meta.url).href;

  /**
   * Name says it all, don't it?.. 
   * > Don't call this allot, it's slow... ideally only on init.
   * @param amount the number of threads to spawn. defaults to the number of reported logical cores.
   */
function spawnDetectionThreads(amount = navigator.hardwareConcurrency){
  const detectionMsgHandler = (e: MessageEvent<TDetectionThreadMessage>) => {
    if (e.data.type === EDetectionThreadMessageType.RESULT) {
      DETECTIONS.get(e.data.for)?.results.push(e.data.result);
      if (
        DETECTIONS.get(e.data.for)?.results.length === detectionThreads.length
      ) {
        // all threads have sent the portion of their results. post the results to the main thread
        const REPLY: TCoordinationThreadMessage = {
          type: ECoordinationThreadMessageType.result,
          results: DETECTIONS.get(e.data.for)?.results.flatMap((x) => x) ??
            [],
        };
        postMessage(REPLY);
        DETECTIONS.delete(e.data.for);
        LOAD_BUFFER?.setUint32(0, DETECTIONS.size);
      }
    }
  }

  // cleanup old threads if any (to avoid dangling threads which potentially causes memory leaks)
  if (detectionThreads.length > 0) {
    for(const thread of detectionThreads) {
      thread.removeEventListener("message", detectionMsgHandler);
      thread.terminate();
    }
  }

  // kind of a slow-esk operation, but we SHOULD only do this once.
  detectionThreads = new Array<Worker>(amount);
  for (let i = 0; i < detectionThreads.length; i++) {
    detectionThreads[i] = new Worker(detectionThreadRef, { type: "module" });
    detectionThreads[i].addEventListener("message",detectionMsgHandler);
  }
}

let licenseDBFilePath = "./licenses/ctph_hashes.wlhdb";

/**
 * Distribute the database sections to the workers that need to be concerned with their respective sections.
 */
function DistributeConcerns() {
  const licenseDB = new LicenseStorage(licenseDBFilePath);
  const licenseCount = licenseDB.getEntryCount();
  const licensesPerThread = Math.floor(licenseCount / detectionThreads.length);
  let currentThreadIndex = 0;
  // would be nice if we can pre-group the licenses into chunks and send them to the threads.
  for (const licenseEntry of licenseDB.entriesBatched(licensesPerThread)) {
    const INIT_MSG: TDetectionThreadMessage = {
      type: EDetectionThreadMessageType.INIT,
      db: licenseEntry.buffer,
    };
    detectionThreads[currentThreadIndex]?.postMessage(INIT_MSG, [
      licenseEntry.buffer,
    ]);
    currentThreadIndex = (currentThreadIndex + 1) % detectionThreads.length;
  }
}

self.onmessage = (e: MessageEvent<TCoordinationThreadMessage>) => {
  if (e.data.type === ECoordinationThreadMessageType.init) {
    const { loadBuffer, dbFilePath } = e.data;
    LOAD_BUFFER = new DataView(loadBuffer);
    LOAD_BUFFER.setUint32(0, DETECTIONS.size);

    licenseDBFilePath = dbFilePath;

    spawnDetectionThreads(e.data.nDetectionThreads);
    DistributeConcerns();
  } else if (e.data.type === ECoordinationThreadMessageType.syncDatabase) {
    DistributeConcerns();
  } else if (e.data.type === ECoordinationThreadMessageType.detect) {
    const { id, license, minConfidence } = e.data;

    // set up storage for request
    DETECTIONS.set(id, {
      results: [],
    });
    LOAD_BUFFER?.setUint32(0, DETECTIONS.size);
    // const licenseCount = licenseDB.getEntryCount()
    const SHARED_LICENSE_BUFFER = new SharedArrayBuffer(
      e.data.license.byteLength,
    );
    const RAW_LICENSE = new Uint8Array(SHARED_LICENSE_BUFFER);
    RAW_LICENSE.set(new Uint8Array(license));

    for (const thread of detectionThreads) {
      const MSG: TDetectionThreadMessage = {
        type: EDetectionThreadMessageType.DETECT,
        id,
        srcl: SHARED_LICENSE_BUFFER,
        minConfidence,
      };
      thread.postMessage(MSG);
    }
  }
};
