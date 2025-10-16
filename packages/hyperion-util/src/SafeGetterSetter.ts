/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "hyperion-globals";


export class SafeGetterSetter<T> {
  private _instance: T | null = null;

  constructor(public readonly name = "") { }

  isSet(): boolean {
    return this._instance !== null;
  }
  get(): T {
    assert(this._instance !== null, 'Channel instance read before set', { logger: { error(msg) { console.error(msg); throw msg; } } });
    return this._instance;
  }

  set(instance: T): void {
    assert(!this.isSet(), 'Channel instance can only be set once');
    this._instance = instance;
  }
}
