/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
  * @jest-environment jsdom
 */

import "jest";
import { SESSION_DATA_SAVE_INTERVAL, SessionPersistentData } from "../src/SessionPersistentData";
describe('test session persistent data', () => {
  test('test data saved / restored correctly', (done) => {
    const fieldName = "testValue";
    const v1 = new SessionPersistentData(fieldName, () => "--", v => v, v => v);
    v1.setValue("v2");
    const lastValue = v1.setValue("V3");

    setTimeout(
      () => {
        const v2 = new SessionPersistentData(fieldName, () => "--", v => v, v => v);
        expect(v2.getValue()).toBe(lastValue);
        done();
      },
      SESSION_DATA_SAVE_INTERVAL + 10
    );
  });
});