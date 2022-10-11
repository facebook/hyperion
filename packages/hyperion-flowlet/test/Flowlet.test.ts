/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { Flowlet } from "../src/Flowlet";

describe("test Flowlet", () => {
  test("test Flowlet methods", () => {
    const f1 = new Flowlet<{
      i?: number;
    }>("f1");

    const f2 = f1.fork("f2");

    expect(f2.parent).toStrictEqual(f1);
    expect(f1.fullName()).toBe("/f1");
    expect(f2.fullName()).toBe("/f1/f2");
    f1.data.i = 10;
    expect(f2.data.i).toBe(10);
    f2.data.i = 20;
    expect(f2.data.i).toBe(20);

  });

});