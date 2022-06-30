/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IPromise from "../src/IPromise";
import { interceptFunction } from "../src/FunctionInterceptor";

describe('test Promise', () => {
  test('test promise.then', async () => {
    const thenArgsObserver = jest.fn();
    const thenValueObserver = jest.fn();

    const argsMapper = IPromise.then.onArgsMapperAdd(([onfulfilled, onrejected]) => {
      if (onfulfilled) {
        const wrappedOnfulfilled = interceptFunction(onfulfilled);
        wrappedOnfulfilled.onArgsObserverAdd(thenArgsObserver);
        wrappedOnfulfilled.onValueObserverAdd(thenValueObserver);
        onfulfilled = wrappedOnfulfilled.interceptor;
      }
      return [onfulfilled, onrejected];
    });

    await Promise.resolve(10).then(value => value + 32);
    expect(thenArgsObserver).toBeCalledWith(10);
    expect(thenValueObserver).toBeCalledWith(42);

    IPromise.then.onArgsMapperRemove(argsMapper);
  });

  test('test promise.catch', async () => {
    const thenArgsObserver = jest.fn();
    const thenValueObserver = jest.fn();

    const argsMapper1 = IPromise.then.onArgsMapperAdd(([onfulfilled, onrejected]) => {
      if (onfulfilled) {
        const wrappedOnfulfilled = interceptFunction(onfulfilled);
        wrappedOnfulfilled.onArgsObserverAdd(thenArgsObserver);
        wrappedOnfulfilled.onValueObserverAdd(thenValueObserver);
        onfulfilled = wrappedOnfulfilled.interceptor;
      }
      return [onfulfilled, onrejected];
    });


    const catchArgsObserver = jest.fn();
    const catchValueObserver = jest.fn();
    const argsMapper2 = IPromise.Catch.onArgsMapperAdd(([onrejected]) => {
      if (onrejected) {
        const wrapped = interceptFunction(onrejected);
        wrapped.onArgsObserverAdd(catchArgsObserver);
        wrapped.onValueObserverAdd(catchValueObserver);
        onrejected = wrapped.interceptor;
      }
      return [onrejected];
    });



    await Promise.reject(10).catch(reason => reason + 500).then(value => value + 32);
    expect(catchArgsObserver).toBeCalledWith(10);
    expect(catchValueObserver).toBeCalledWith(510);
    expect(thenArgsObserver).toBeCalledWith(510);
    expect(thenValueObserver).toBeCalledWith(542);

    IPromise.then.onArgsMapperRemove(argsMapper1);

  });

});