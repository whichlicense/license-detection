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

import { detectLicenseRawDB } from "../components/detecting.ts";

export enum ECoordinationThreadMessageType {
    detect,
    result,
    progress
}

export type TCoordinationThreadMessage = {
    type: ECoordinationThreadMessageType.result,
    results: ReturnType<typeof detectLicenseRawDB>
} | {
    type: ECoordinationThreadMessageType.progress,
    data: number
} | {
    type: ECoordinationThreadMessageType.detect,
    license: ArrayBufferLike,
    id: string
}


export enum EDetectionThreadMessageType {
    RESULT
}

// TODO: unionize this when we have more options
export type TDetectionThreadReply = {
    type: EDetectionThreadMessageType.RESULT,
    for: string,
    result: ReturnType<typeof detectLicenseRawDB>
}

/**
 * Incoming message in the detection thread.
 */
export type TDetectionThreadMessage = {
    /**
     * Source license
     */
    srcl: SharedArrayBuffer,
    /**
     * DB section
     */
    db: ArrayBufferLike,
    /**
     * ID of the license
     *  
     */
    id: string
}