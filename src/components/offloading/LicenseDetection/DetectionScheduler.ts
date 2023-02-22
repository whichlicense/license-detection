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

import {
  ECoordinationThreadMessageType,
  TCoordinationThreadMessage,
} from "types/DetectionScheduler";
import { TLicense } from "types/License";
import { detectLicense, LICENSE_DETECT_DEFAULTS } from "components/detecting";
import { v1 } from "https://deno.land/std@0.177.0/uuid/mod.ts";
import { TLicenseDetectOptions } from "../../../types/LicenseDetect.ts";

export class DetectionScheduler {
  private coordinationThreads: {
    w: Worker;
    loadView: DataView;
    load: number;
  }[] = [];
  private tidx = 0;

  constructor(
    coordinationThreads = navigator.hardwareConcurrency,
    detectionThreads = navigator.hardwareConcurrency,
    filePath = "./licenses/ctph_hashes.wlhdb",
  ) {
    for (let i = 0; i < coordinationThreads; i++) {
      const LOAD_BUFF = new SharedArrayBuffer(4);
      const temp = {
        w: new Worker(
          new URL("./coordinationThread.ts", import.meta.url).href,
          { type: "module" },
        ),
        loadView: new DataView(LOAD_BUFF),
        get load() {
          return this.loadView.getUint32(0);
        },
      };
      this.coordinationThreads.push(temp);
      const INIT_MSG: TCoordinationThreadMessage = {
        type: ECoordinationThreadMessageType.init,
        loadBuffer: LOAD_BUFF,
        dbFilePath: filePath,
        nDetectionThreads: detectionThreads,
      };
      temp.w.postMessage(INIT_MSG);
    }
  }

  private findFreeCoordinationThread(): Worker {
    const freeCoordinationThread = this.coordinationThreads[this.tidx];
    this.tidx = (this.tidx + 1) % this.coordinationThreads.length; 
      
    return freeCoordinationThread.w;
  }

  getLoadInfo() {
    return this.coordinationThreads.map((t, i) => {
      return { id: i, load: t.load };
    });
  }

  syncDatabase() {
    for (const t of this.coordinationThreads) {
      t.w.postMessage({
        type: ECoordinationThreadMessageType.syncDatabase,
      });
    }
  }

  // TODO: method to change db?

  /**
   * > **NOTE!**: this method transfers the license buffer to the coordination thread, this means you **can't** use the license buffer after calling this method.
   * @param license
   * @returns
   */
  public detectLicense(
    license: TLicense,
    options: Omit<TLicenseDetectOptions, "licenseDB"> & {timeout?: number} = {},
  ): Promise<ReturnType<typeof detectLicense>> {
    options = {
      ...LICENSE_DETECT_DEFAULTS,
      ...options,
    }
    return new Promise((resolve, reject) => {
      const coordinationThread = this.findFreeCoordinationThread();
      const REQ_TIMEOUT = options.timeout
        ? setTimeout(() => {
          reject("request timed out");
        }, options.timeout)
        : undefined;


      const listeningCallback = (e: MessageEvent<TCoordinationThreadMessage>) => {
        if (e.data.type === ECoordinationThreadMessageType.result) {
          if (REQ_TIMEOUT) clearTimeout(REQ_TIMEOUT);
          resolve(e.data.results);
          coordinationThread.removeEventListener("message", listeningCallback);
        }
      }

      coordinationThread.addEventListener("message", listeningCallback);

      const THREAD_MSG: TCoordinationThreadMessage = {
        type: ECoordinationThreadMessageType.detect,
        license: license.buffer,
        id: v1.generate() as string,
        minConfidence: options.minConfidenceThreshold!,
        // TODO: pass in exit early option
      };
      coordinationThread.postMessage(THREAD_MSG, [license.buffer]);
    });
  }
}
