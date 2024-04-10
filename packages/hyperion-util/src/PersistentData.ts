/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { TimedTrigger } from "@hyperion/hyperion-timed-trigger/src/TimedTrigger";

function getStorage(storageName: 'sessionStorage' | 'localStorage'): Storage | null {
  let storage: Storage;
  try {
    storage = window[storageName];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return storage;
  } catch (e) {
    return null;
  }
}

const SessionStorage = getStorage('sessionStorage');
const LocalStorage = getStorage('localStorage');

export const SESSION_DATA_SAVE_INTERVAL = 100; //ms

class PersistentData<T> {
  private static runner: TimedTrigger | null = null;
  private static pending = new Set<PersistentData<any>>();
  private schedule() {
    if (!this.isPersisted()) {
      return; // Not much to do!
    }

    if (!PersistentData.runner) {
      PersistentData.runner = new TimedTrigger(
        () => {
          for (const i of PersistentData.pending) {
            i.save();
          }
          PersistentData.pending.clear();
          PersistentData.runner = null;
        },
        SESSION_DATA_SAVE_INTERVAL
      );
    } else {
      PersistentData.runner.delay(); // If not saved yet, postpone
    }
    PersistentData.pending.add(this);
  }

  private _data: T;

  constructor(
    private readonly fieldName: string,
    missingValueInitializer: () => T,
    private readonly stringify: (value: T) => string,
    parser: (persistedValue: string) => T,
    private readonly storage: Storage | null,
  ) {
    let persistedData = this.storage?.getItem(this.fieldName);
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
    this.storage?.setItem(this.fieldName, this.stringify(this._data));
  }


  isPersisted(): boolean {
    return this.storage !== null;
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

export class SessionPersistentData<T> extends PersistentData<T> {
  constructor(
    fieldName: string,
    missingValueInitializer: () => T,
    stringify: (value: T) => string,
    parser: (persistedValue: string) => T,
  ) {
    super(fieldName, missingValueInitializer, stringify, parser, SessionStorage);
  }
}

export class LocalStoragePersistentData<T> extends PersistentData<T> {
  constructor(
    fieldName: string,
    missingValueInitializer: () => T,
    stringify: (value: T) => string,
    parser: (persistedValue: string) => T,
  ) {
    super(fieldName, missingValueInitializer, stringify, parser, LocalStorage);
  }
}

