/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

/**
 * Runs `callback` in the first task after the next frame is painted.
 *
 * requestAnimationFrame callbacks run *before* the frame's style/layout/paint, so work
 * scheduled from inside one still lands in the critical path of that frame. Chaining a
 * second requestAnimationFrame gets you past the paint, but at the cost of a whole extra
 * frame (~16ms at 60Hz) because the second callback waits for the next vsync.
 *
 * Posting a task from inside the animation frame instead lands immediately after that
 * frame's rendering steps complete, which is the same "layout is clean, paint is done"
 * point that two chained frames reach, roughly a frame sooner.
 *
 * There is no shipped API that expresses this directly (`requestPostAnimationFrame` was
 * proposed for exactly this and never shipped by default), so we post the highest priority
 * task the browser gives us:
 *
 *  - `scheduler.postTask` at `user-blocking` priority, which is ordered ahead of other
 *    posted work and of timers.
 *  - a MessageChannel message otherwise. It is a normal task with no clamping, unlike
 *    `setTimeout(0)` which browsers clamp to >=4ms once nested.
 *  - `setTimeout` as a last resort, for environments with neither.
 *
 * Like any requestAnimationFrame-based scheduling this does not run while the page is
 * hidden; the callback fires once the page becomes visible again and frames resume.
 */

type TaskPriority = 'user-blocking' | 'user-visible' | 'background';
type SchedulerWithPostTask = {
  postTask?: (callback: () => void, options?: { priority?: TaskPriority }) => Promise<unknown>;
};

let postHighPriorityTask: (callback: () => void) => void = callback => {
  const scheduler: SchedulerWithPostTask | undefined = (globalThis as { scheduler?: SchedulerWithPostTask }).scheduler;
  if (typeof scheduler?.postTask === 'function') {
    const postTask = scheduler.postTask.bind(scheduler);
    postHighPriorityTask = cb => {
      // postTask rejects if the task is aborted; we never abort, but stay quiet regardless.
      postTask(cb, { priority: 'user-blocking' }).catch(() => { });
    };
  } else if (typeof MessageChannel === 'function') {
    /**
     * One channel is shared by every caller. Messages are delivered in post order, so
     * callbacks still run in the order they were scheduled.
     */
    const pending: Array<() => void> = [];
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      const cb = pending.shift();
      cb?.();
    };
    postHighPriorityTask = cb => {
      pending.push(cb);
      channel.port2.postMessage(null);
    };
  } else {
    postHighPriorityTask = cb => { setTimeout(cb, 0); };
  }
  postHighPriorityTask(callback);
};

export function scheduleAfterPaint(callback: () => void): void {
  requestAnimationFrame(() => {
    postHighPriorityTask(callback);
  });
}
