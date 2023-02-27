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

import { cloneByteArray } from "../tests/utils.ts";

const OBJECT_LENGTHS = [5000000 /* 5 mb */, 10000000 /* 10 mb */, 100000000 /* 100 mb */];

// deno-lint-ignore no-explicit-any
function sendAndWaitForMessage(worker: Worker, message: any, transfer: Transferable[] = []) {
    return new Promise((resolve) => {
        const t = setTimeout(() => {
            throw new Error("Timeout");
        }, 20000);

        worker.onmessage = (e) => {
            if(e.data === 2) {
                resolve(e.data);
                clearTimeout(t);
            }
        };

        worker.postMessage(message, transfer);
    });
}

const structured_cloning_thread = `
self.onmessage = (e) => {
    const incoming = e.data.obj;
    postMessage(incoming[0] + 1);
}
`

const transferable_object_thread = `
self.onmessage = (e) => {
    const incoming = new Uint8Array(e.data.obj);
    postMessage(incoming[0] + 1);
}
`

const shared_object_thread = `
self.onmessage = (e) => {
    const incoming = new Uint8Array(e.data.obj);
    postMessage(incoming[0] + 1);
}
`

for(const OBJECT_LENGTH of OBJECT_LENGTHS) {

    const object = new Uint8Array(OBJECT_LENGTH).fill(1);

    const shared_object = new SharedArrayBuffer(OBJECT_LENGTH)
    new Uint8Array(shared_object).fill(1)
    
    // Do not re-order to top.. snapshotting will make the benchmark results unfair due to optimizations.
    const structured_cloning_worker = new Worker(URL.createObjectURL(new Blob([structured_cloning_thread])), { type: "module" });
    const transferable_object_worker = new Worker(URL.createObjectURL(new Blob([transferable_object_thread])), { type: "module" });
    const shared_object_worker = new Worker(URL.createObjectURL(new Blob([shared_object_thread])), { type: "module" });
    const group = `obj_handoff_${OBJECT_LENGTH}`
    
    Deno.bench(`Structured cloning (BASELINE) - ${OBJECT_LENGTH} bytes`,
        { group },
        async () => {
            // cloning is not required here as the object is not transferred, it does however make the benchmarks a bit more fair.
            const obj = cloneByteArray(object);
            await sendAndWaitForMessage(structured_cloning_worker, { obj: obj });
        }
    );
    
    Deno.bench(`Transferable object - ${OBJECT_LENGTH} bytes`,
        { group },
        async () => {
            // this cloning is slow but is required as the previous object is transferred (bench is run multiple times)
            const obj = cloneByteArray(object);
            await sendAndWaitForMessage(transferable_object_worker, { obj: obj.buffer }, [obj.buffer]);
        }
    );
    
    Deno.bench(`Shared object - ${OBJECT_LENGTH} bytes`,
        { group },
        async () => {
            // we clone here anyways just to make the benchmarks fair!
            const obj = cloneByteArray(object);
            obj[0] + 1; // just to make sure its now cleaned up or something
            await sendAndWaitForMessage(shared_object_worker, { obj: shared_object });
        }
    );
}



