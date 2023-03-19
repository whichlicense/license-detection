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

pub mod detecting;
pub mod license_tools;
// pub mod offloading;
pub mod pipeline_tools;


pub use crate::detecting::detecting::*;
pub use crate::license_tools::license_tools::*;
pub use crate::pipeline_tools::pipeline::*;
// pub use crate::offloading::threaded_detection::*;


// // C mappings
// #[no_mangle]
// pub extern "C" fn e_strip_license(l: &str) -> String {
//     strip_license(l)
// }