/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { setAssertLoggerOptions, assert } from "../src/assert";

describe("test assert", () => {
  test("test assert message", () => {
    let _message;
    assert(false, "test message", { logger: { error: message => { _message = message } } });
    expect(_message).toBe("test message");
  });

  test("change default assert logger", () => {
    const fn = jest.fn();
    setAssertLoggerOptions({
      logger: { error: fn }
    });
    assert(false, "test message");
    expect(fn).toBeCalledTimes(1);
    expect(fn.mock.calls[0][0]).toBe("test message");
  });

  test("Reading __DEV__ in test", () => {
    expect(__DEV__).toBeDefined();
  });
})
