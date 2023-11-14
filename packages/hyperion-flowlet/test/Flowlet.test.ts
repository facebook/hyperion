/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { Flowlet } from "../src/Flowlet";

describe("test Flowlet", () => {
  test("test Flowlet methods", () => {
    const f1 = new Flowlet<{
      triggerFlowlet: any,
      i?: number;
    }>("f1");

    const f2 = f1.fork("f2");

    expect(f2.parent).toStrictEqual(f1);
    expect(f1.getFullName()).toBe("/f1");
    expect(f2.getFullName()).toBe("/f1/f2");
    f1.data.i = 10;
    expect(f2.data.i).toBe(10);
    f2.data.i = 20;
    expect(f2.data.i).toBe(20);

  });

  test("long flowlet chain", () => {
    let flowlet = new Flowlet<{}>('f1');
    for (let i = 0; i < 100000; ++i) {
      flowlet = flowlet.fork('f');
    }

    const name = flowlet.getFullName();
    expect(name.length).toBeGreaterThan(1000);
    expect(name).toMatch(/[.][.][.](?:[/]f)+/);
  });

  test("include id in the flowlet name", () => {
    let flowlet = new Flowlet<{}>('f1');
    expect(flowlet.getFullName(true)).toMatch(/f1:\d+/);
  });
});