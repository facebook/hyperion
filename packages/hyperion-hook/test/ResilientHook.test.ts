/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ResilientHook } from '../src/ResilientHook';

describe('ResilientHook', () => {
  test('preserves receiver, arguments, results, and listener identity', () => {
    const errors: unknown[] = [];
    const hook = new ResilientHook<
      (this: { multiplier: number }, value: number) => number
    >((error) => errors.push(error));
    const callback = hook.add(function (value) {
      return this.multiplier * value;
    });

    expect(hook.hasCallback(callback)).toBe(true);
    expect(hook.call.call({ multiplier: 3 }, 4)).toBe(12);
    expect(errors).toEqual([]);
    expect(hook.remove(callback)).toBe(true);
    expect(hook.hasCallback()).toBe(false);
  });

  test('isolates failures and snapshots dispatch', () => {
    const errors: unknown[] = [];
    const calls: string[] = [];
    const hook = new ResilientHook<() => void>((error) => errors.push(error));
    const removed = () => calls.push('removed');
    const added = () => calls.push('added');
    let changed = false;
    hook.add(() => {
      calls.push('first');
      if (!changed) {
        changed = true;
        hook.remove(removed);
        hook.add(added);
      }
      throw new Error('listener failure');
    });
    hook.add(removed);
    hook.add(() => calls.push('last'));

    expect(() => hook.call()).not.toThrow();
    expect(calls).toEqual(['first', 'removed', 'last']);
    expect(errors).toHaveLength(1);

    calls.length = 0;
    hook.call();
    expect(calls).toEqual(['first', 'last', 'added']);
    expect(errors).toHaveLength(2);
  });

  test('removes once callbacks even when they throw', () => {
    const errors: unknown[] = [];
    const hook = new ResilientHook<() => void>((error) => errors.push(error));
    const once = jest.fn(() => {
      throw new Error('once failure');
    });
    const later = jest.fn();
    hook.add(once, true);
    hook.add(later);

    hook.call();
    hook.call();

    expect(once).toHaveBeenCalledTimes(1);
    expect(later).toHaveBeenCalledTimes(2);
    expect(errors).toHaveLength(1);
  });

  test('ignores failures from its error handler', () => {
    const hook = new ResilientHook<() => void>(() => {
      throw new Error('error handler failure');
    });
    const later = jest.fn();
    hook.add(() => {
      throw new Error('listener failure');
    });
    hook.add(later);

    expect(() => hook.call()).not.toThrow();
    expect(later).toHaveBeenCalledTimes(1);
  });
});
