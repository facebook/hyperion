/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

type TimeoutID = number | any /* React expects Timeout?! */;

/**
 * This class can be used when we want to run a function once either by calling
 * it explicitly, or have it run after a certain time automatically.
 * It also allows cancelling or delaying the function if it has not yet
 * executed.
 * The class also exposes the current state of the function.
 *
 * Generally, this is useful utility for handling state changes that may
 * have a time element as well.
 *
 * The final callback function will know if it was called directly or by the
 * timer.
 */
export class TimedTrigger {
  _timeoutID: TimeoutID | null = null;
  _timerFired: boolean = false;
  _delay: number;
  _action: null | ((timerFired: boolean) => void);

  constructor(action: (timerFired: boolean) => void, delay: number) {
    this._action = action;
    this._delay = delay;
    this._setTimer();
  }

  _clearTimer() {
    if (this._timeoutID != null) {
      clearTimeout(this._timeoutID);
    }
    this._timeoutID = null;
  }

  _setTimer() {
    if (!this.isDone()) {
      this._clearTimer();
      this._timeoutID = setTimeout(() => {
        this._timerFired = true;
        this.run();
      }, this._delay);
    }
  }

  isDone(): boolean {
    return this._action === null;
  }

  isCancelled(): boolean {
    return this._timeoutID === null && this._action !== null;
  }

  run() {
    this._clearTimer();
    if (this._action != null) {
      // Copy and change before calling so we know this isDone
      const action = this._action;
      this._action = null;
      action(this._timerFired);
    }
  }

  getDelay(): number {
    return this._delay;
  }

  delay(delay?: number) {
    this._delay = delay ?? this._delay;
    this._setTimer();
  }

  cancel() {
    this._clearTimer();
  }
}
