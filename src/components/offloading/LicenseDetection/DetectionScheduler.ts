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

// TODO: schedule multithreaded work when detecting licenses from a big pool of options
// TODO: since we work with 'parts' we can calculate the progress and keep track of it.

/*
    # option 1: no coordinating thread (main thread has the burden of coordinating)
    Spawn all threads. keep track of them. once we receive an instruction to detect, we split the work up and send it to the threads.
    We wait for the individual parts, and then we merge the results.
    ### <potential> problems:
    - main thread is blocked every time we wish to detect.
    - main thread needs to deal with multiple detection requests and merge the results based on who requested what.

    # [optimal] option 2: coordinating thread (main thread is free to do other work)
    once we receive an instruction to detect, 
    we send the work to the coordinating thread, which then splits the work up and sends it to the detection threads.
    the coordinating thread wait for its individual parts, and then it merges the results.
    after that, it sends the results back to the main thread.
    ### <potential> problems:
    - we can't keep track of all threads unless we spawn them from within the coordinating thread. 
        (we can fix this by pre-spawning the coordinating thread and its detection threads)
    - ....

    window.navigator.hardwareConcurrency <--- this is the number of threads we can use per CPU.
*/

import { ECoordinationThreadMessageType, TCoordinationThreadMessage } from "../../../types/DetectionScheduler.ts";
import { TLicense } from "../../../types/License.ts";
import { detectLicenseRawDB } from "../../detecting.ts";
import {v1} from "https://deno.land/std@0.177.0/uuid/mod.ts";

export class DetectionScheduler {
    private coordinationThreads: {w: Worker, progress: 1}[]
    private fallBackTurn = 0
    constructor() {
        console.log("DetectionScheduler created")
        // TODO: if this url proves to be a problem we can use import  maps with import.meta.resolve
        this.coordinationThreads = [
            {
                w: new Worker(new URL("./coordinationThread.ts", import.meta.url).href, { type: "module" }),
                // TODO: instead of fetching this we can have a shared array buffer for each thread, and a getter which returns the progress as a float
                //          for the float we can use a dataview to fetch the float out of the single byte entry.
                progress: 1,
            }
        ]

        // TODO: listen for progress updates from the coordination threads, update the object in the array
        for (const coordinationThread of this.coordinationThreads) {
            coordinationThread.w.addEventListener('message', (e) => {
                if (e.data.type === ECoordinationThreadMessageType.progress) {
                    coordinationThread.progress = e.data.progress
                }
            })
        }
    }

    // TODO: method to get scheduler load as percentage (indicating how many threads are busy)

    private findFreeCoordinationThread(): Worker {
        const freeCoordinationThread = this.coordinationThreads.find((ct) => ct.progress === 1)
        if (freeCoordinationThread) {
            return freeCoordinationThread.w
        } else {
            // fallback to round robin when all threads are busy.
            const coordinationThread = this.coordinationThreads[this.fallBackTurn]
            this.fallBackTurn = (this.fallBackTurn + 1) % this.coordinationThreads.length
            return coordinationThread.w
        }
    }

    // TODO: method to re-load all databases in all threads

    public detectLicense(license: TLicense): Promise<ReturnType<typeof detectLicenseRawDB>> {
        return new Promise((resolve, reject) => {
            // TODO: implement timeout rejection system
            const coordinationThread = this.findFreeCoordinationThread()
            coordinationThread.addEventListener('message', (e: MessageEvent<TCoordinationThreadMessage>) => {
                if (e.data.type === ECoordinationThreadMessageType.result) {
                    resolve(e.data.results)
                }
            })
            // TODO: generate or take in an id.
            const THREAD_MSG: TCoordinationThreadMessage = { type: ECoordinationThreadMessageType.detect, license: license.buffer, id: v1.generate() as string }
            coordinationThread.postMessage(THREAD_MSG, [license.buffer])
        })
    }
}