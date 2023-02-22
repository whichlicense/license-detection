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

import LicenseStorage from "components/storage";

export type TLicenseDetectOptions = {
    licenseDB?: LicenseStorage;
    /**
     * The minimum confidence required for a license to be detected.
     * If the confidence is below this threshold, the detection will not include this license.
     **/
    minConfidenceThreshold?: number

    /**
     * If the confidence is at or above this threshold, the detection will stop early and return the results up until this point.
     */
    earlyExitThreshold?: number
}