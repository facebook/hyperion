/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

'use strict';

import {Hook} from 'hyperion-hook';

/**
 * See details at: https://fb.workplace.com/groups/uie.support/permalink/27375838162038106/
 * performance.now() on some browsers has a bug and falls behind: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now#ticking_during_sleep
 * to solve this, inside of performanceAbsoluteNow, we adjust the value of performance.now()
 * by comparing againgst Date.now() and adjusting the value. Since there are multiple
 * other modules who use performance.now(), we need to make sure all of them are
 * adjusted. Referencing the performnaceAbsoluteNow can cause bundle size issues
 * in many places.
 * I put this low cost event mechanism that other modules can direclty use to
 * adjust accordingly when needed, without incurring extra bundle size cost.
 * (e.g. see performanceNow.js)
 */
export const performanceNowOnAdjust: Hook<(delta: number) => void> =
  new Hook();
