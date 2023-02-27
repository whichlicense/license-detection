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

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { stripLicense } from "components/minification";
import { detectLicense } from "components/detecting";
import LicenseStorage from "../src/components/storage.ts";
import { computeLicenseHash } from "../src/scripts/computeLicenses.ts";

const TEST_LICENSE_1 = Deno.readFileSync("./licenses/RAW/apache-2.0.LICENSE");

Deno.test("License matching is up to spec", {}, async (t) => {
  await t.step("Exact license is detected with 100% confidence", () => {
    const detected = detectLicense(TEST_LICENSE_1);

    assert(detected.length > 0);
    assertEquals(detected[0].name, "apache-2.0.LICENSE");
    assertEquals(detected[0].confidence, 1);
  });

  await t.step("Similar license is detected with >90% confidence", () => {
    const detected = detectLicense(new TextEncoder().encode(stripLicense(TEST_LICENSE_2)));
    assert(detected.length > 0);
    assertEquals(detected[0].name, "apache-2.0.LICENSE");
    assert(detected[0].confidence > 0.9);
  });

  await t.step("Unavailable license is not detected", () => {
    const detected = detectLicense(
      new TextEncoder().encode(TEST_LICENSE_3),
    );
    assert(detected.length === 0);
  });

  await t.step("Early exit above exits early", async (t) => {
    const temp_file = Deno.makeTempFileSync();
    const temp_storage = new LicenseStorage(temp_file)

    

    temp_storage.addLicense({
      name: "TEST_LICENSE_1",
      hash: computeLicenseHash(new TextEncoder().encode("0111111111"), 1, 2).hash,
      blockSize: 1,
      fuzzyHashLength: 2,
    })

    temp_storage.addLicense({
      name: "TEST_LICENSE_1.1",
      hash: computeLicenseHash(new TextEncoder().encode("0111111112"), 1, 2).hash,
      blockSize: 1,
      fuzzyHashLength: 2,
    })

    temp_storage.addLicense({
      name: "TEST_LICENSE_2",
      hash: computeLicenseHash(new TextEncoder().encode("0000011111"), 1, 2).hash,
      blockSize: 1,
      fuzzyHashLength: 2,
    })

    temp_storage.addLicense({
      name: "TEST_LICENSE_3",
      hash: computeLicenseHash(new TextEncoder().encode("0000000000"), 1, 2).hash,
      blockSize: 1,
      fuzzyHashLength: 2,
    })

    await t.step("Early exit >= 90% works", () => {
      const  res = detectLicense(new TextEncoder().encode("0111111111"), {
        licenseDB: temp_storage,
        minConfidenceThreshold: 0, // include everything by default
        earlyExitThreshold: 0.9, // exit early if we have a match at or above 90%
      })

      assertEquals(res.length, 1); // the first license should match with 100% confidence. the second license should match with 90% confidence, but we exit early
      assertEquals(res[0].confidence, 1);
    });

    await t.step("Early exits on exact match", () => {
      const  res = detectLicense(new TextEncoder().encode("0111111112"), {
        licenseDB: temp_storage,
        minConfidenceThreshold: 0, // include everything by default
        earlyExitThreshold: 1, // exit early if we have a match at 100% (exact match)
      })

      assertEquals(res.length, 2); // the first two licenses should match with 90% confidence and 100% confidence respectively
      assertEquals(res[0].confidence, 0.9);
      assertEquals(res[1].confidence, 1); // no more matches after this!
    });

    await t.step("Default lets all in", () => {
      const  res = detectLicense(new TextEncoder().encode("0111111112"), {
        licenseDB: temp_storage,
        minConfidenceThreshold: 0, // include everything by default
      })

      assertEquals(res.length, temp_storage.getEntryCount()); // the first two licenses should match with 90% confidence and 100% confidence respectively
    });

    temp_storage.closeDB()
    Deno.removeSync(temp_file)
  });
});

const TEST_LICENSE_2 = stripLicense(`
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction,
and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by
the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all
other entities that control, are controlled by, or are under common
control with that entity. For the purposes of this definition,
"control" means (i) the power, direct or indirect, to cause the
direction or management of such entity, whether by contract or
otherwise, or (ii) ownership of fifty percent (50%) or more of the
outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity
exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications,
including but not limited to software source code, documentation
source, and configuration files.

"Object" form shall mean any form resulting from mechanical
transformation or translation of a Source form, including but
not limited to compiled object code, generated documentation,
and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or
Object form, made available under the License, as indicated by a
copyright notice that is included in or attached to the work
(an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object
form, that is based on (or derived from) the Work and for which the
editorial revisions, annotations, elaborations, or other modifications
represent, as a whole, an original work of authorship. For the purposes
of this License, Derivative Works shall not include works that remain
separable from, or merely link (or bind by name) to the interfaces of,
the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including
the original version of the Work and any modifications or additions
to that Work or Derivative Works thereof, that is intentionally
submitted to Licensor for inclusion in the Work by the copyright owner
or by an individual or Legal Entity authorized to submit on behalf of
the copyright owner. For the purposes of this definition, "submitted"
means any form of electronic, verbal, or written communication sent
to the Licensor or its representatives, including but not limited to
communication on electronic mailing lists, source code control systems,
and issue tracking systems that are managed by, or on behalf of, the
Licensor for the purpose of discussing and improving the Work, but
excluding communication that is conspicuously marked or otherwise
designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity
on behalf of whom a Contribution has been received by Licensor and
subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
this License, each Contributor hereby grants to You a perpetual,
worldwide, non-exclusive, no-charge, royalty-free, irrevocable
copyright license to reproduce, prepare Derivative Works of,
publicly display, publicly perform, sublicense, and distribute the
Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
this License, each Contributor hereby grants to You a perpetual,
worldwide, non-exclusive, no-charge, royalty-free, irrevocable
(except as stated in this section) patent license to make, have made,
use, offer to sell, sell, import, and otherwise transfer the Work,
where such license applies only to those patent claims licensable
by such Contributor that are necessarily infringed by their
Contribution(s) alone or by combination of their Contribution(s)
with the Work to which such Contribution(s) was submitted. If You
institute patent litigation against any entity (including a
cross-claim or counterclaim in a lawsuit) alleging that the Work
or a Contribution incorporated within the Work constitutes direct
or contributory patent infringement, then any patent licenses
granted to You under this License for that Work shall terminate
as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
Work or Derivative Works thereof in any medium, with or without
modifications, and in Source or Object form, provided that You
meet the following conditions:

(a) You must give any other recipients of the Work or
Derivative Works a copy of this License; and

(b) You must cause any modified files to carry prominent notices
stating that You changed the files; and

(c) You must retain, in the Source form of any Derivative Works
that You distribute, all copyright, patent, trademark, and
attribution notices from the Source form of the Work,
excluding those notices that do not pertain to any part of
the Derivative Works; and

(d) If the Work includes a "NOTICE" text file as part of its
distribution, then any Derivative Works that You distribute must
include a readable copy of the attribution notices contained
within such NOTICE file, excluding those notices that do not
pertain to any part of the Derivative Works, in at least one
of the following places: within a NOTICE text file distributed
as part of the Derivative Works; within the Source form or
documentation, if provided along with the Derivative Works; or,
within a display generated by the Derivative Works, if and
wherever such third-party notices normally appear. The contents
of the NOTICE file are for informational purposes only and
do not modify the License. You may add Your own attribution
notices within Derivative Works that You distribute, alongside
or as an addendum to the NOTICE text from the Work, provided
that such additional attribution notices cannot be construed
as modifying the License.

You may add Your own copyright statement to Your modifications and
may provide additional or different license terms and conditions
for use, reproduction, or distribution of Your modifications, or
for any such Derivative Works as a whole, provided Your use,
reproduction, and distribution of the Work otherwise complies with
the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
any Contribution intentionally submitted for inclusion in the Work
by You to the Licensor shall be under the terms and conditions of
this License, without any additional terms or conditions.
Notwithstanding the above, nothing herein shall supersede or modify
the terms of any separate license agreement you may have executed
with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
names, trademarks, service marks, or product names of the Licensor,
except as required for reasonable and customary use in describing the
origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
agreed to in writing, Licensor provides the Work (and each
Contributor provides its Contributions) on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied, including, without limitation, any warranties or conditions
of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
PARTICULAR PURPOSE. You are solely responsible for determining the
appropriateness of using or redistributing the Work and assume any
risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
whether in tort (including negligence), contract, or otherwise,
unless required by applicable law (such as deliberate and grossly
negligent acts) or agreed to in writing, shall any Contributor be
liable to You for damages, including any direct, indirect, special,
incidental, or consequential damages of any character arising as a
result of this License or out of the use or inability to use the
Work (including but not limited to damages for loss of goodwill,
work stoppage, computer failure or malfunction, or any and all
other commercial damages or losses), even if such Contributor
has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
the Work or Derivative Works thereof, You may choose to offer,
and charge a fee for, acceptance of support, warranty, indemnity,
or other liability obligations and/or rights consistent with this
License. However, in accepting such obligations, You may act only
on Your own behalf and on Your sole responsibility, not on behalf
of any other Contributor, and only if You agree to indemnify,
defend, and hold each Contributor harmless for any liability
incurred by, or claims asserted against, such Contributor by reason
of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

To apply the Apache License to your work, attach the following
boilerplate notice

Copyright (c) 2023 Duart Snel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
`);

const TEST_LICENSE_3 = stripLicense(`
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi posuere sagittis metus, sit amet ullamcorper erat ultrices sed. Duis ut tellus malesuada, tempor purus sollicitudin, posuere augue. Pellentesque ornare enim ornare vestibulum porta. Vivamus ac mauris sed libero interdum finibus. Ut vestibulum leo tortor, id iaculis eros porttitor vitae. Nunc eu sagittis odio. Nunc tempus mauris a pellentesque sagittis.

Quisque eleifend auctor molestie. Cras convallis volutpat nunc, a pretium ante tempus at. Duis vestibulum nisi metus, non interdum velit faucibus vitae. Pellentesque ac euismod elit. Vivamus ac est lectus. Fusce quis sapien quam. Vestibulum magna nisi, euismod non lobortis et, viverra in orci.

Maecenas fermentum sagittis laoreet. Aliquam congue dolor tortor, et aliquam enim volutpat a. Pellentesque eu libero erat. Phasellus sodales laoreet lobortis. Proin laoreet dolor mollis, vulputate augue a, pellentesque ipsum. Mauris at purus efficitur, ornare ante eget, elementum est. Integer vel risus aliquet, fringilla ex vulputate, hendrerit magna. Suspendisse ut nisi condimentum, auctor magna et, pellentesque arcu. Morbi convallis tempus nibh eget aliquam. Nullam sit amet ligula arcu. Mauris fermentum lectus a laoreet aliquam.

Suspendisse ullamcorper non enim consectetur rhoncus. Nunc sed ultricies libero. Sed quis aliquet ante. Fusce vitae dapibus urna, a malesuada massa. Donec pretium libero non lacus euismod, ac mollis enim consequat. Nunc fermentum neque ante, quis hendrerit risus eleifend et. Ut imperdiet convallis dictum. Phasellus feugiat laoreet scelerisque.

In molestie, odio nec viverra facilisis, enim erat consequat urna, sit amet auctor arcu massa vitae purus. In a nisl a est pretium iaculis. Pellentesque quis interdum erat, eu auctor quam. Nam ullamcorper nisl vitae ligula hendrerit, vitae viverra ipsum sollicitudin. Vestibulum mauris risus, semper in feugiat nec, condimentum sed dolor. Integer pellentesque, elit ut posuere volutpat, metus ligula fermentum massa, at bibendum nisl elit at urna. Vestibulum ullamcorper magna libero, vitae faucibus mauris efficitur ut. Phasellus ornare ultricies rhoncus. Mauris congue nibh ut convallis tincidunt. Ut a purus magna. Maecenas sit amet purus a enim dapibus luctus. Pellentesque venenatis arcu molestie, blandit nisi sed, porttitor ante. In hac habitasse platea dictumst. Curabitur condimentum sodales risus. Aenean dolor massa, pretium ac auctor imperdiet, volutpat aliquam justo.
`);