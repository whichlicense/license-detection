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

// TODO: import maps!!!
import { TDetectionThreadMessage, EDetectionThreadMessageType,ECoordinationThreadMessageType, TCoordinationThreadMessage, TDetectionResult } from "../../../types/DetectionScheduler.ts";
import LicenseStorage from "../../storage.ts";

// TODO: how many workers does the user want to spawn? make this configurable. i believe we can use either env here or a config file.
const detectionThreads = new Array<Worker>(navigator.hardwareConcurrency);
const DETECTIONS = new Map<string, {
    results: Array<TDetectionResult>
    progress: number
}>();

let LOAD_BUFFER: DataView | undefined;
const detectionThreadRef = new URL("./detectionThread.ts", import.meta.url).href

// spawn the threads
for (let i = 0; i < detectionThreads.length; i++) {
    detectionThreads[i] = new Worker(detectionThreadRef, { type: "module" });
    
    detectionThreads[i].addEventListener("message", (e: MessageEvent<TDetectionThreadMessage>) => {
        if(e.data.type === EDetectionThreadMessageType.RESULT){
            DETECTIONS.get(e.data.for)?.results.push(e.data.result);
            if(DETECTIONS.get(e.data.for)?.results.length === detectionThreads.length){
                // all threads have sent the portion of their results. post the results to the main thread
                 // TODO: results don't have an id, so we can't match them to the request.!!
                 // TODO: extract into seperate function...
                const REPLY: TCoordinationThreadMessage = {type: ECoordinationThreadMessageType.result, results: DETECTIONS.get(e.data.for)?.results.flatMap(x => x) ?? []};
                postMessage(REPLY);
                DETECTIONS.delete(e.data.for);
                LOAD_BUFFER?.setUint32(0, DETECTIONS.size)
            }
        }
    });
}

// TODO: use import maps to make this a bit better
const licenseDB = new LicenseStorage("./licenses/ctph_hashes.wlhdb");


// TODO: we need a map so that we can distinguish between which computation belongs to which license request



// TODO: add instruction to update thread concerns if license db changes.
/**
 * Distribute the database sections to the workers that need to be concerned with their respective sections.
 */
function DistributeConcerns(){
    const licenseCount = licenseDB.getEntryCount();
    const licensesPerThread = Math.floor(licenseCount / detectionThreads.length)
    let currentThreadIndex = 0;
    // would be nice if we can pre-group the licenses into chunks and send them to the threads.
    for(const licenseEntry of licenseDB.entriesBatched(licensesPerThread)){
        const INIT_MSG: TDetectionThreadMessage = {
            type: EDetectionThreadMessageType.INIT,
            db: licenseEntry.buffer
        }
        detectionThreads[currentThreadIndex]?.postMessage(INIT_MSG, [licenseEntry.buffer]);
        currentThreadIndex = (currentThreadIndex + 1) % detectionThreads.length;
    }
}


// TODO: pre-spawn the threads.. spawnup time can be slow.
self.onmessage = (e: MessageEvent<TCoordinationThreadMessage>) => {
    if(e.data.type === ECoordinationThreadMessageType.init){
        const {loadBuffer} = e.data;
        LOAD_BUFFER = new DataView(loadBuffer);
        LOAD_BUFFER.setUint32(0, DETECTIONS.size)

        DistributeConcerns();
    }else if(e.data.type === ECoordinationThreadMessageType.detect){
        const {id, license} = e.data;

        // set up storage for request
        DETECTIONS.set(id, {
            results: [],
            get progress() {
                return this.results.length / detectionThreads.length;
            }
        });
        LOAD_BUFFER?.setUint32(0, DETECTIONS.size)
        // const licenseCount = licenseDB.getEntryCount()
        const SHARED_LICENSE_BUFFER = new SharedArrayBuffer(e.data.license.byteLength);
        const RAW_LICENSE = new Uint8Array(SHARED_LICENSE_BUFFER);
        RAW_LICENSE.set(new Uint8Array(license));

        for(const thread of detectionThreads){
            const MSG: TDetectionThreadMessage = {
                type: EDetectionThreadMessageType.DETECT,
                id,
                srcl: SHARED_LICENSE_BUFFER,
            }
            thread.postMessage(MSG);
        }
    }
};