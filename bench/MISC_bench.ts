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

/**
 * Basically everything else that is small and needs to benchmarking to make decisions.
 */



// --------- type checking ---------
Deno.bench(
    `instanceof check`, { group: "type_checking" }, () => {
        const bArr = new Uint8Array(2);
        bArr instanceof Uint8Array;
    },
);
Deno.bench(
    `[X].constructor == check`, { group: "type_checking" }, () => {
        const bArr = new Uint8Array(2);
        bArr.constructor === Uint8Array;
    }
);
Deno.bench(
    `[X].constructor === check`, { group: "type_checking" }, () => {
        const bArr = new Uint8Array(2);
        bArr.constructor === Uint8Array;
    }
);
Deno.bench(
    `property spy check`, { group: "type_checking" }, () => {
        const bArr = new Uint8Array(2);
        // here we know that Uint8Array.BYTES_PER_ELEMENT === 1 so we can use that to check if it is a Uint8Array
        // NOTE!!: this only works if the other types don't have the same property or have different values for the property.
        bArr.BYTES_PER_ELEMENT === 1
    }
);