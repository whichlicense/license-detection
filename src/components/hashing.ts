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
  for (let i = 0; i < Math.min(hashLength, buffer.length); i++) {
    hash = (hash << 5) - hash + buffer[i];
    hash |= 0;
  }

  const res = hash.toString(radix);
  return res;
}

export function compareHashes(
  hash1: string,
  hash2: string,
  minConfidence = 0,
) {
  const blocks1 = hash1.split(":");
  const blocks2 = hash2.split(":");

  let commonBlocks = 0;
  let uncommonBlocks = 0;
  const maxBlocks = Math.max(blocks1.length, blocks2.length);

  const maxUncommonBlocks = minConfidence === 0
    ? maxBlocks + maxBlocks
    : Math.ceil((minConfidence) * Math.max(blocks1.length, blocks2.length));

  uncommonBlocks = Math.abs(blocks1.length - blocks2.length);
  if (uncommonBlocks > maxUncommonBlocks) {
    return {
      commonBlocks: -1,
      totalBlocks: Math.max(blocks1.length, blocks2.length),
      confidence: -1,
    };
  }

  for (let i = 0; i < maxBlocks; i++) {
    if (blocks1[i] === blocks2[i]) {
      commonBlocks++;
    } else {
      uncommonBlocks++;
      if (uncommonBlocks > maxUncommonBlocks) {
        return {
          commonBlocks: -1,
          totalBlocks: Math.max(blocks1.length, blocks2.length),
          confidence: -1,
        };
      }
    }
  }

  return {
    commonBlocks,
    totalBlocks: maxBlocks,
    confidence: (commonBlocks) / Math.max(blocks1.length, blocks2.length),
  };
}

export function fuzzyHash(
  input: Uint8Array,
  blockSize: number,
  hashLength: number,
): string {
  // const blocks: string[] = new Array(input.length);
  const blocks = new Array<string>();

  for (let i = 0; i < input.length; i += blockSize) {
    const block = input.slice(i, i + blockSize);
    const hash = createHash(block, hashLength);
    blocks.push(hash);
  }

  return blocks.join(":");
}

// TODO: import meta main for further compilation of the code for external calling
