/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { AsyncCounter } from "@hyperion/global/src/AsyncCounter";
import * as IGlobalThis from "../src/IGlobalThis";
import { interceptFunction } from "../src/FunctionInterceptor";

function wrapHandler(handler: Function | string, observer: jest.Mock<any, any>) {
  if (typeof handler === "string") {
    handler = new Function(handler);
  };
  const fi = interceptFunction(handler);
  fi.onArgsObserverAdd(observer);
  return fi.interceptor;
}

describe('test Global Scope interception', () => {

  test('test setTImeout', async () => {
    const observer = jest.fn();
    IGlobalThis.setTimeout.onArgsMapperAdd(args => {
      args[0] = wrapHandler(args[0], observer);
      return args;
    });

    const counter = new AsyncCounter(1);
    setTimeout(
      () => {
        counter.countUp();
      },
      1000
    );

    const finalCount = await counter.reachTarget();

    expect(observer).toBeCalledTimes(finalCount);
  });

  test('test setInterval', async () => {
    const observer = jest.fn();
    IGlobalThis.setInterval.onArgsMapperAdd(args => {
      args[0] = wrapHandler(args[0], observer);
      return args;
    });

    const counter = new AsyncCounter(5);
    const id = setInterval(
      () => {
        counter.countUp();
      },
      100
    );

    const finalCount = await counter.reachTarget();

    clearInterval(id);

    expect(observer).toBeCalledTimes(finalCount);
  });
});