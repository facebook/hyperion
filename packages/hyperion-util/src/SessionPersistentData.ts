/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { TimedTrigger } from "./TimedTrigger";

function getStorage(): Storage | null {
  let storage: Storage;
  try {
    storage = window.sessionStorage;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return storage;
  } catch (e) {
    return null;
  }
}

const SessionStorage = getStorage();

export const SESSION_DATA_SAVE_INTERVAL = 100; //ms

export class SessionPersistentData<T> {
  private static runner: TimedTrigger | null = null;
  private static pending = new Set<SessionPersistentData<any>>();
  private schedule() {
    if (!this.isPersisted()) {
      return; // Not much to do!
    }

    if (!SessionPersistentData.runner) {
      SessionPersistentData.runner = new TimedTrigger(
        () => {
          for (const i of SessionPersistentData.pending) {
            i.save();
          }
          SessionPersistentData.pending.clear();
          SessionPersistentData.runner = null;
        },
        SESSION_DATA_SAVE_INTERVAL
      );
    } else {
      SessionPersistentData.runner.delay(); // If not saved yet, postpone
    }
    SessionPersistentData.pending.add(this);
  }

  private _data: T;

  constructor(
    private readonly fieldName: string,
    missingValueInitializer: () => T,
    private readonly stringify: (value: T) => string,
    parser: (persistedValue: string) => T,
  ) {
    let persistedData = SessionStorage?.getItem(this.fieldName);
    let data;
    if (!persistedData) {
      data = missingValueInitializer();
      this.setValue(data);
    } else {
      data = parser(persistedData);
    }
    this._data = data;
  }

  private save() {
    SessionStorage?.setItem(this.fieldName, this.stringify(this._data));
  }


  isPersisted(): boolean {
    return SessionStorage !== null;
  }

  getValue(): T {
    return this._data;
  }

  setValue(data: T): T {
    this._data = data;
    this.schedule();
    return data;
  }

}