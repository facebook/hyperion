/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "hyperion-globals";

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

type GetTimeFunc = () => number;
type GetTimeFuncExtensions = {
  setFallback: (fallback: () => number) => void;
  fromRelativeTime(timestamp: number): number;
};

let performanceAbsoluteNow: GetTimeFunc & GetTimeFuncExtensions;

let fallback = () => Date.now();

/**
 * Allows callers to override the default fallback implementation of Date.now.
 * This should only be used in rare cases, such as in Web Workers to sync up start time.
 */
function setFallback(fn: () => number) {
  fallback = fn;
}

let navigationStart = -1;
const performanceIsDefined = typeof performance === "object";
const performanceNowIsDefined = performanceIsDefined && typeof performance.now === "function";
if (performanceIsDefined) {
  if (performance.timing && performance.timing.navigationStart) {
    navigationStart = performance.timing.navigationStart;
  } else if (performance.timeOrigin) {
    navigationStart = performance.timeOrigin;
  }
}

let coreFunction: GetTimeFunc;
if (performanceNowIsDefined && navigationStart !== -1) {
  coreFunction = () => performance.now() + navigationStart;
} else {
  coreFunction = () => fallback();
}



const extensions: GetTimeFuncExtensions = {
  setFallback,
  fromRelativeTime: (() => {
    assert(navigationStart !== -1, "cannot convert from relative time without a time origin value for navigation start");
    if (navigationStart === -1) {
      const navigationStartApproximate = performanceNowIsDefined
        ? Date.now() - performance.now()
        : 0;
      return (timestamp: number) => {
        return timestamp + navigationStartApproximate;
      };

    } else {
      return (timestamp: number) => {
        return timestamp + navigationStart;
      };
    }
  })(),
};

performanceAbsoluteNow = Object.assign(coreFunction, extensions);

export default performanceAbsoluteNow;
