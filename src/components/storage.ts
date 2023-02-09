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

import { TLicenseDBEntry } from "../types/License.ts";


/*

structure:
// file heading information
0000000000002 // entry count

// this is an entry block
size of block
name
hash
block size
hash length
<...repeat block>

example:

82
MIT
hfj24978389fh4839fn3948nf384nf9538h3489nf8943h48f9hn4389fn8943f3489fn8
4
5
    <space>
85
Apache-2.0
hfj24978389fh4839fn3948nf384nf9538h3489nf8943h48f9hn4389fn8943f3489fn8
4
5

*/

export default class LicenseStorage {
    private file: Deno.FsFile;
    private filePath: string | URL;
    private options = {
        MAX_FILE_ENTRY_BLOCKS: 13,
        MAX_ENTRY_ALLOC_BLOCKS: 7
    }

    constructor(file: string | URL, options?: {
        MAX_FILE_ALLOC_BLOCKS?: number;
        MAX_ENTRY_ALLOC_BLOCKS?: number;
    }) {
        this.filePath = file;
        if(options) this.options = {...this.options, ...options};

        // TODO: figure out if we need reading..
        this.file = Deno.openSync(file, {create: true, read: true, write: true});
        if(this.file.statSync().size <= 2) this.setEntryCountSync(0);


        addEventListener("unload", () => {
            this.file.close();
        });

        addEventListener("unhandledrejection", () => {
            this.file.close();
        });
    }

    // TODO: method to clean file up.. can we use truncate?

    // TODO: add documentation, ensure they know that this resets the cursor
    getEntryCount(resetCursor?: number, seekMode: Deno.SeekMode = Deno.SeekMode.Start) {
        const cursorPosition = this.file.seekSync(0, Deno.SeekMode.Start);
        const buffer = new Uint8Array(this.options.MAX_FILE_ENTRY_BLOCKS);
        this.file.readSync(buffer);
        if(resetCursor) this.file.seekSync(cursorPosition, seekMode);
        return parseInt(new TextDecoder().decode(buffer));
    }


    private setEntryCountSync(count: number) {
        this.file.seekSync(0, Deno.SeekMode.Start);
        this.file.writeSync(new TextEncoder().encode(`${count.toString().padStart(this.options.MAX_FILE_ENTRY_BLOCKS, '0')}\n`));
    }
            

    addLicense(obj: TLicenseDBEntry) {
        // max section size in bytes: 0000000
        const block = `\n${obj.name}\n${obj.hash}\n${obj.blockSize}\n${obj.fuzzyHashLength}\n`
        const blockSize = `${new TextEncoder().encode(block).length.toString().padStart(this.options.MAX_ENTRY_ALLOC_BLOCKS, '0')}`;

        // seek to end, write block
        // await this.file.seek(0, Deno.SeekMode.End);
        // const B_WRITTEN = await Deno.write(this.file.rid, new TextEncoder().encode(`${blockSize}${block}`));

        // using append mode instead of seek to prevent multiple threads from colliding when writing to file
        Deno.writeTextFileSync(this.filePath, `${blockSize}${block}`, {append: true});

        this.setEntryCountSync(this.getEntryCount() + 1);

    }

    // test(){
    //     const ENTRY_COUNT = this.getEntryCount();
        
    //     this.file.seekSync(0, Deno.SeekMode.Start);
    //     this.file.seekSync(this.options.MAX_FILE_ENTRY_BLOCKS+1, Deno.SeekMode.Current) // skip entry count for testing
        

    //     for(let i = 0; i < ENTRY_COUNT; i++){
    //         const ENTRY_SIZE_BUFFER = new Uint8Array(this.options.MAX_ENTRY_ALLOC_BLOCKS);
    //         this.file.readSync(ENTRY_SIZE_BUFFER);
    //         const ENTRY_SIZE = parseInt(new TextDecoder().decode(ENTRY_SIZE_BUFFER));
    //         // this.file.seekSync(ENTRY_SIZE_BUFFER.length, Deno.SeekMode.Current)
    
    
    //         const LICENSE_ENTRY_BUFFER = new Uint8Array(ENTRY_SIZE);
    //         this.file.readSync(LICENSE_ENTRY_BUFFER);
    //         console.log(new TextDecoder().decode(LICENSE_ENTRY_BUFFER))
    //     }

    //     console.log('entry count:', ENTRY_COUNT)



    // }

    static parseEntry(entry: Uint8Array) {
        const [,name, hash, blockSize, hashLength] = new TextDecoder().decode(entry).split('\n');
        return {
            name,
            hash,
            blockSize: parseInt(blockSize),
            hashLength: parseInt(hashLength)
        }
    }

    *[Symbol.iterator]() {
        const ENTRY_COUNT = this.getEntryCount();
        
        this.file.seekSync(0, Deno.SeekMode.Start);
        this.file.seekSync(this.options.MAX_FILE_ENTRY_BLOCKS+1, Deno.SeekMode.Current) // skip entry count for testing
        

        for(let i = 0; i < ENTRY_COUNT; i++){
            const ENTRY_SIZE_BUFFER = new Uint8Array(this.options.MAX_ENTRY_ALLOC_BLOCKS);
            this.file.readSync(ENTRY_SIZE_BUFFER);
            const ENTRY_SIZE = parseInt(new TextDecoder().decode(ENTRY_SIZE_BUFFER));
    
    
            const LICENSE_ENTRY_BUFFER = new Uint8Array(ENTRY_SIZE);
            this.file.readSync(LICENSE_ENTRY_BUFFER);

            yield LICENSE_ENTRY_BUFFER
        }
    }
}