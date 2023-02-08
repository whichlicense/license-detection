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

import { stripLicense } from "./components/minification.ts";
import { detectLicense } from "./components/detecting.ts";


// TODO: for testing purposes
const licenseText = Deno.readTextFileSync('./TEST_LICENSE')
const incomingLicense = new TextEncoder().encode(stripLicense(licenseText))

const unclassified = JSON.parse(Deno.readTextFileSync('./licenses/unclassified.json'))

const matches = detectLicense(incomingLicense, undefined, 0.1)


if(matches.length === 0){
  console.log('No matches found');
  // TODO: only store things like file path, not the whole license text. request the license text from the server when needed.
  // TODO: maybe extract features from the license and store these to make lawyers happy
  unclassified.push(licenseText)
  console.log('Added to unclassified licenses\n\n', licenseText)
}else {
  // just printing out for testing
  const bestMatch = matches.sort((a, b) => b.confidence - a.confidence);
  console.log(`Found ${matches.length} matches.
  The best match is ${bestMatch[0].name} with a confidence of ${Math.min(100, bestMatch[0].confidence*100)}%

  All matches (ranked):
  ${matches
    .map(match => `${Math.min(100, (match.confidence*100)).toFixed(2)}% - ${match.name} \t Common blocks: ${match.commonBlocks}/${match.totalBlocks}`)
    .join('\n')
  }
  `)

}