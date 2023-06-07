/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IPromise from "../src/IPromise";
import { interceptFunction } from "../src/FunctionInterceptor";

describe('test Promise', () => {
  test('test promise.constructor', async () => {
    const argsObserver = jest.fn();
    const valueObserver = jest.fn();

    const handler = IPromise.constructor.onBeforeCallArgsAndAfterReturnValueMapperAdd(args => {
      const executor = args[0];
      const fi = interceptFunction(executor);
      args[0] = fi.interceptor;
      fi.onBeforeCallArgsMapperAdd(args => {
        const resolve = args[0];
        const resolveFI = interceptFunction(resolve);
        args[0] = resolveFI.interceptor;
        resolveFI.onBeforeCallArgsObserverAdd(argsObserver);
        return args;
      })
      return value => {
        valueObserver(value);
        return value;
      }
    });

    const p = new Promise<number>((resolve, reject) => {
      Promise.resolve(10).then(resolve, reject);
    });

    await p;

    expect(argsObserver).toBeCalledWith(10);
    expect(valueObserver).toBeCalledWith(p);

    IPromise.constructor.onBeforeCallArgsAndAfterReturnValueMapperRemove(handler);
  });

  test('test promise.then', async () => {
    const thenArgsObserver = jest.fn();
    const thenValueObserver = jest.fn();

    const argsMapper = IPromise.then.onBeforeCallArgsMapperAdd(([onfulfilled, onrejected]) => {
      if (onfulfilled) {
        const wrappedOnfulfilled = interceptFunction(onfulfilled);
        wrappedOnfulfilled.onBeforeCallArgsObserverAdd(thenArgsObserver);
        wrappedOnfulfilled.onAfterReturnValueObserverAdd(thenValueObserver);
        onfulfilled = wrappedOnfulfilled.interceptor;
      }
      return [onfulfilled, onrejected];
    });

    await Promise.resolve(10).then(value => value + 32);
    expect(thenArgsObserver).toBeCalledWith(10);
    expect(thenValueObserver).toBeCalledWith(42);

    IPromise.then.onBeforeCallArgsMapperRemove(argsMapper);
  });

  test('test promise.catch', async () => {
    const thenArgsObserver = jest.fn();
    const thenValueObserver = jest.fn();

    const argsMapper1 = IPromise.then.onBeforeCallArgsMapperAdd(([onfulfilled, onrejected]) => {
      if (onfulfilled) {
        const wrappedOnfulfilled = interceptFunction(onfulfilled);
        wrappedOnfulfilled.onBeforeCallArgsObserverAdd(thenArgsObserver);
        wrappedOnfulfilled.onAfterReturnValueObserverAdd(thenValueObserver);
        onfulfilled = wrappedOnfulfilled.interceptor;
      }
      return [onfulfilled, onrejected];
    });


    const catchArgsObserver = jest.fn();
    const catchValueObserver = jest.fn();
    const argsMapper2 = IPromise.Catch.onBeforeCallArgsMapperAdd(([onrejected]) => {
      if (onrejected) {
        const wrapped = interceptFunction(onrejected);
        wrapped.onBeforeCallArgsObserverAdd(catchArgsObserver);
        wrapped.onAfterReturnValueObserverAdd(catchValueObserver);
        onrejected = wrapped.interceptor;
      }
      return [onrejected];
    });



    await Promise.reject(10).catch(reason => reason + 500).then(value => value + 32);
    expect(catchArgsObserver).toBeCalledWith(10);
    expect(catchValueObserver).toBeCalledWith(510);
    expect(thenArgsObserver).toBeCalledWith(510);
    expect(thenValueObserver).toBeCalledWith(542);

    IPromise.then.onBeforeCallArgsMapperRemove(argsMapper1);

  });

  test("test Promise behavior back to normal", async () => {
    const result = await Promise.resolve(1).then(value => value + 1);
    expect(result).toBe(2);

    const observer = jest.fn();
    await Promise.reject(1).catch(observer);
    expect(observer).toBeCalledTimes(1);
  });


  ([
    [IPromise.all, () => Promise.all([Promise.resolve(1), Promise.resolve(2)])],
    [IPromise.allSettled, () => Promise.allSettled([Promise.resolve(1), Promise.reject(2)])],
    // [IPromise.any, () => Promise.any([Promise.resolve(1), Promise.resolve(2)])],
    [IPromise.race, () => Promise.race([1, Promise.resolve(2)])],
    [IPromise.reject, () => Promise.reject(1)],
    [IPromise.resolve, () => Promise.resolve(2)],
  ] as const).forEach(([interceptor, tester]) => {
    test(`test Promise.${interceptor.name} static method`, async () => {
      const argsObserver = jest.fn();
      const handler = interceptor.onBeforeCallArgsObserverAdd(values => {
        argsObserver(values);
      });
      try {
        await tester();
      } catch { }
      expect(argsObserver).toBeCalledTimes(1);
      interceptor.onBeforeCallArgsObserverRemove(handler);
    });
  });

});