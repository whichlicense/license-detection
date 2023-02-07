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

// TODO: faster hashing available: xxHash or CityHash 
export function createHash(buffer: Uint8Array, hashLength: number): string {
    const radix = 36;
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
      hash = (hash << 5) - hash + buffer[i];
      hash |= 0;
    }

    const res = hash.toString(radix).padStart(hashLength, '0');

    if(res.length > hashLength) {
        console.warn(`[!] hash is too long.. expected ${hashLength} but got ${hash.toString(radix).length}..`);
    }else if (res.length < hashLength) {
        console.warn(`[!] hash is too short.. expected ${hashLength} but got ${hash.toString(radix).length}..`);
    }

    return res;
}

export function compareHashes(hash1: string, hash2: string, h1Length = 5, h2Length = 5) {
    // const blocks1 = hash1.split(':');
    // const blocks2 = hash2.split(':');

    const blocks1 = hash1.match(new RegExp(`.{1,${h1Length}}`, 'g')) || [];
    const blocks2 = hash2.match(new RegExp(`.{1,${h2Length}}`, 'g')) || [];
  
    let commonBlocks = 0;
    for (let i = 0; i < blocks1.length && i < blocks2.length; i++) {
      if (blocks1[i] === blocks2[i]) {
        commonBlocks++;
      }
    }

    const maxBlocks =  Math.max(blocks1.length, blocks2.length);

    return {
        commonBlocks,
        totalBlocks: maxBlocks,
        confidence: (commonBlocks) / Math.max(blocks1.length, blocks2.length)
    }
}


export function fuzzyHash(input: Uint8Array, blockSize: number, hashLength: number): string {
    // const blocks: string[] = new Array(input.length);
    let blocks = ""
  
    for (let i = 0; i < input.length; i += blockSize) {
      const block = input.slice(i, i + blockSize);
      const hash = createHash(block, hashLength);
      blocks += hash;
    }

    return blocks;

    // TODO: we can use webworker here to calculate the hashes in parallel. i will only optimize if required.
}

// TODO: import meta main for further compilation of the code for external calling