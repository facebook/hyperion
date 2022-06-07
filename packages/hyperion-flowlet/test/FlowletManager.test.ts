/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { Flowlet } from "../src/Flowlet";

import { FlowletManager } from "../src/FlowletManager";

describe("test FlowletManager", () => {
  test("test FlowletManager methods and events", () => {
    const manager = new FlowletManager();

    const pushes = [];
    manager.onPush.add(flowlet => pushes.push(flowlet));

    const pops = [];
    manager.onPop.add(flowlet => pops.push(flowlet));

    const main = manager.push(new Flowlet("main"));
    const f1 = manager.push(main.fork("f1"));
    const f2 = manager.push(main.fork("f2"));
    const p1 = manager.pop(f2);
    const f1_1 = manager.push(f1.fork("f1.1"));

    expect(f1_1.fullName()).toBe("/main/f1/f1.1");

    expect(manager.top()).toStrictEqual(f1_1);
    expect(manager.pop(f1_1)).toStrictEqual(f1_1);
    expect(pushes).toStrictEqual([main, f1, f2, f1_1]);
    expect(pops).toStrictEqual([p1, f1_1])
  });

  test("test FlowletManager methods and events for async code", async () => {
    const manager = new FlowletManager();

    const pushes = [];
    manager.onPush.add(flowlet => pushes.push(flowlet));

    const pops = [];
    manager.onPop.add(flowlet => pops.push(flowlet));

    const main = manager.push(new Flowlet("main"));
    const f1 = manager.push(main.fork("f1"));
    expect(manager.top()).toStrictEqual(f1);

    const f2 = manager.push(main.fork("f2"));
    const p1 = Promise.resolve().then(() => {
      return manager.pop(f2);
    });
    expect(manager.top()).toStrictEqual(f2);

    manager.pop(f1);
    expect(manager.top()).toStrictEqual(f2);
    expect(await p1).toStrictEqual(f2);
    expect(manager.top()).toStrictEqual(main);
  });

});