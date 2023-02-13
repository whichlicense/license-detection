# WhichLicense detection
This is a library to facilitate the detection of licenses in source code.

## Usage
### Multi-threaded detection
The multi-threaded detection works by spawning a number of scheduling threads which subsequently spawns a number of detection threads. The scheduling threads are responsible for splitting the license database into sections and handing them off to the detection threads. The detection threads are responsible for detecting the licenses in the given section of the license database.

Most operating systems will spread the scheduling threads across the available cores whilst the detection threads will be spread across the available threads.

```typescript
const ds = new DetectionScheduler();
const detected = await ds.detectLicense(SOME_LICENSE);
```

### Single-threaded detection
```typescript
detectLicense(SOME_LICENSE);
```

# Attributions
## ScanCode License data
> The initial database was generated by making use of the license data from the ScanCode toolkit.

Copyright (c) nexB Inc. and others. All rights reserved. ScanCode is a trademark
of nexB Inc. SPDX-License-Identifier: CC-BY-4.0 See
https://creativecommons.org/licenses/by/4.0/legalcode for the license text. See
https://github.com/nexB/scancode-toolkit for support or download. See
https://aboutcode.org for more information about nexB OSS projects.
