/*
 *   Copyright (c) 2023 Duart Snel
 *   All rights reserved.

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

// TODO: import map
import { EDetectionThreadMessageType, TDetectionThreadMessage, TDetectionThreadReply } from "../../../types/DetectionScheduler.ts";
import { detectLicenseRawDB } from "../../detecting.ts";

// TODO: we can maybe use new promises with timeouts to force async computation in the thread?

/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />



// TODO: pass in confidence threshold if required.
self.onmessage = (e: MessageEvent<TDetectionThreadMessage>) => {
    const RAW_LICENSE = new Uint8Array(e.data.srcl); // memory is shared across threads
    const THREAD_DB = new Uint8Array(e.data.db); // section of the db handed off to this thread

    const matches = detectLicenseRawDB(RAW_LICENSE, THREAD_DB);
    // detectLicense(RAW_LICENSE, e.data.db)

    const REPLY: TDetectionThreadReply = {type: EDetectionThreadMessageType.RESULT, for: e.data.id, result: matches}
    postMessage(REPLY);
};
