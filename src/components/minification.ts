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

export function stripLicense(text: string): string {
  return text.replaceAll(/( |\t|\n|\r|\n\r|\r\n)/g, "");
}
// TODO: maybe we can make use of a builder pattern here to make the API easier to use. (i..e, what do you want to strip?)

if (import.meta.main) {
  console.log(stripLicense(Deno.readTextFileSync(Deno.args[0])));
}
