/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "@hyperion/hyperion-global/src/assert";
import { TimedTrigger } from "@hyperion/hyperion-timed-trigger/src/TimedTrigger";

type IStorage = Pick<Storage, 'getItem' | 'setItem'>;
function getStorage(storageName: 'sessionStorage' | 'localStorage'): IStorage {
  let storage: Storage;
  try {
    storage = window[storageName];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return storage;
  } catch (e) {
    return {
      getItem(_key) {
        return null;
      },
      setItem(_key, _value) {
      }
    };
  }
}

const SessionStorage = getStorage('sessionStorage');
const LocalStorage = getStorage('localStorage');

export const SESSION_DATA_SAVE_INTERVAL = 20; //ms

class Scheduler {
  private runner: TimedTrigger | null = null;
  private pending = new Set<PersistentData<any>>();
  public schedule: (data: PersistentData<any>) => void = data => {
    // First call we decide what state to go in, then move to new states

    const firstRun = (data: PersistentData<any>) => {
      assert(!this.runner, "Invalid state! First call should not have runner");
      const runner = this.runner = new TimedTrigger(
        () => {
          for (const i of this.pending) {
            i.save();
          }
          this.pending.clear();
          this.runner = null;
          this.schedule = firstRun;
        },
        SESSION_DATA_SAVE_INTERVAL
      );
      if (typeof window === "object" && typeof window.addEventListener === 'function') {
        window.addEventListener('beforeUnload', () => {
          runner.run();
          // disable scheduing permanently
          this.schedule = (data: PersistentData<any>) => {
            data.save();
          }
        });
      }
      const nextRun = (data: PersistentData<any>) => {
        runner.delay();
        this.pending.add(data);
      }
      this.pending.add(data);
      this.schedule = nextRun;
    };
    firstRun(data);
  }
}

class PersistentData<T> {
  private static scheduler = new Scheduler();
  private _data: T;

  constructor(
    private readonly fieldName: string,
    missingValueInitializer: () => T,
    private readonly stringify: (value: T) => string,
    parser: (persistedValue: string) => T,
    private readonly saveImmediately: boolean,
    private readonly storage: IStorage,
  ) {
    let persistedData = this.storage.getItem(this.fieldName);
    let data;
    if (!persistedData) {
      data = missingValueInitializer();
      this.setValue(data);
    } else {
      data = parser(persistedData);
    }
    this._data = data;
  }

  save() {
    this.storage.setItem(this.fieldName, this.stringify(this._data));
  }

  getValue(): T {
    return this._data;
  }

  setValue(data: T): T {
    this._data = data;
    if (this.saveImmediately) {
      this.save();
    } else {
      PersistentData.scheduler.schedule(this);
    }
    return data;
  }

}

export class SessionPersistentData<T> extends PersistentData<T> {
  constructor(
    fieldName: string,
    missingValueInitializer: () => T,
    stringify: (value: T) => string,
    parser: (persistedValue: string) => T,
    saveImmediately: boolean = false,
  ) {
    super(fieldName, missingValueInitializer, stringify, parser, saveImmediately, SessionStorage);
  }
}

export class LocalStoragePersistentData<T> extends PersistentData<T> {
  constructor(
    fieldName: string,
    missingValueInitializer: () => T,
    stringify: (value: T) => string,
    parser: (persistedValue: string) => T,
    saveImmediately: boolean = false,
  ) {
    super(fieldName, missingValueInitializer, stringify, parser, saveImmediately, LocalStorage);
  }
}

