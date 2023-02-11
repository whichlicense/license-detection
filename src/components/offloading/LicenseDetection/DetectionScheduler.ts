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
    private coordinationThreads: {w: Worker, loadView: DataView, load: number}[] = []

    constructor(coordinationThreads = navigator.hardwareConcurrency) {
        console.log("DetectionScheduler created")
        // TODO: if this url proves to be a problem we can use import  maps with import.meta.resolve
        for(let i = 0; i < coordinationThreads; i++){
            const LOAD_BUFF = new SharedArrayBuffer(4)
            const temp = {
                w: new Worker(new URL("./coordinationThread.ts", import.meta.url).href, { type: "module" }),
                loadView: new DataView(LOAD_BUFF),
                get load() {
                    return this.loadView.getUint32(0)
                }
            }
            this.coordinationThreads.push(temp)
            const INIT_MSG: TCoordinationThreadMessage = {type: ECoordinationThreadMessageType.init, loadBuffer: LOAD_BUFF}
            temp.w.postMessage(INIT_MSG)
        }
    }

    // TODO: method to get scheduler load as percentage (indicating how many threads are busy)

    private findFreeCoordinationThread(): Worker {
        // TODO: early exit sorting.. i.e., exit if value is 0 or continue to sort to find smallest
        const freeCoordinationThread = this.coordinationThreads[0].load === 0 ? this.coordinationThreads[0] : this.coordinationThreads.sort((a, b) => a.load - b.load)[0]
        return freeCoordinationThread.w;
    }

    getLoadInfo(){
        return this.coordinationThreads.map((t,i) => {return {id: i, load: t.load}})
    }

    // TODO: method to re-load all databases in all threads

    /**
     * > **NOTE!**: this method transfers the license buffer to the coordination thread, this means you **can't** use the license buffer after calling this method.
     * @param license 
     * @returns 
     */
    public detectLicense(license: TLicense): Promise<ReturnType<typeof detectLicenseRawDB>> {
        return new Promise((resolve, reject) => {
            // TODO: implement timeout rejection system
            const coordinationThread = this.findFreeCoordinationThread()
            coordinationThread.addEventListener('message', (e: MessageEvent<TCoordinationThreadMessage>) => {
                if (e.data.type === ECoordinationThreadMessageType.result) {
                    // TODO: results don't have an id, so we can't match them to the request.!!
                    resolve(e.data.results)
                }
            })

            // TODO: pass in min confidence threshold to threads
            const THREAD_MSG: TCoordinationThreadMessage = { type: ECoordinationThreadMessageType.detect, license: license.buffer, id: v1.generate() as string }
            coordinationThread.postMessage(THREAD_MSG, [license.buffer])
        })
    }
}