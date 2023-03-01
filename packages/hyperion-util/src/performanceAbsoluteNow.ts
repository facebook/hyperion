/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

/**
 * Sometimes we want absolute time and we
 * also want high resolution timestamp. This function provides high resolution
 * timestamp in absolute time.
 *
 * Known problem: Precision will be limited to 1/1000 millisecond. That's what
 * the spec requires for high resolution timestamp. Chrome provides higher
 * precision, but the limit of double precision floating point number cuts that
 * down to 1/1000 milliseconds when representing absolute time.
 *
 */


let performanceAbsoluteNow: {
  (): number,
  setFallback?: (fallback: () => number) => void,
};

let fallback = () => Date.now();

/**
 * Allows callers to override the default fallback implementation of Date.now.
 * This should only be used in rare cases, such as in Web Workers to sync up start time.
 */
function setFallback(fn: () => number) {
  fallback = fn;
}

let navigationStart = -1;
if (performance.timing && performance.timing.navigationStart) {
  navigationStart = performance.timing.navigationStart;
} else if (performance.timeOrigin) {
  navigationStart = performance.timeOrigin
}

if (typeof performance.now === "function" && navigationStart !== -1) {
  performanceAbsoluteNow = () => performance.now() + navigationStart;
} else {
  performanceAbsoluteNow = () => fallback();
}
performanceAbsoluteNow.setFallback = setFallback;

export default performanceAbsoluteNow;
