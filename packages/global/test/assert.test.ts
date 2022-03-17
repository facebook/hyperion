/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { assert } from "../src/assert";

describe("test assert", () => {
  test("test assert message", () => {
    let _message;
    assert(false, "test message", { logger: { error: message => { _message = message } } });
    expect(_message).toBe("test message");
  });

})
