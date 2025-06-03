/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "hyperion-globals";
import { performanceNowOnAdjust } from "./performanceNowOnAdjust";

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
  __adjust: () => number,
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
let timeOriginDelta = 0;
const performanceIsDefined = typeof performance === "object";
const performanceNowIsDefined = performanceIsDefined && typeof performance.now === "function";
if (performanceIsDefined) {
  if (performance.timeOrigin) {
    navigationStart = performance.timeOrigin;
  } else if (performance.timing && performance.timing.navigationStart) {
    navigationStart = performance.timing.navigationStart;
  }
}

let coreFunction: GetTimeFunc;
let coreAdjustedFunction: GetTimeFunc;
let __adjust: GetTimeFuncExtensions["__adjust"] = () => 0;
if (performanceNowIsDefined && navigationStart !== -1) {
  coreFunction = () => performance.now() + navigationStart;
  coreAdjustedFunction = () => coreFunction() + timeOriginDelta;
  __adjust = () => {
    const delta = Date.now() - coreFunction();
    if (delta > 500) {
      /**
       * The delta should be generally withing a few ms.
       * If the delta is greater than .5 second, we assume that the browser
       * has been backgrounded and we need to adjust the timeOrigin.
       * Assuming the initial timeOrigin was the same as Date.now, then
       * delta shows how much performance.now() is lagging behind Date.now()
       * so by adding that to timeOrigin we can "catch up"
       */
      timeOriginDelta = delta;
      performanceNowOnAdjust.call(delta);
    }
    return delta;
  };

  if (
    typeof window === "object" &&
    typeof window.addEventListener === "function"
  ) {
    const SafeEventOptions = {
      capture: false,
      passive: true,
    };
    window.addEventListener("blur", __adjust, SafeEventOptions);
    window.addEventListener("focus", __adjust, SafeEventOptions);
  }
} else {
  coreAdjustedFunction = coreFunction = () => fallback();
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
  __adjust
};

performanceAbsoluteNow = Object.assign(coreAdjustedFunction, extensions);

export default performanceAbsoluteNow;
