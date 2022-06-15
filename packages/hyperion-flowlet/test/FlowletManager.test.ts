/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { Flowlet } from "../src/Flowlet";

import { FlowletManager } from "../src/FlowletManager";

describe("test FlowletManager", () => {
  test("test FlowletManager methods and events", () => {
    const manager = new FlowletManager();

    const pushes: Flowlet[] = [];
    manager.onPush.add(flowlet => pushes.push(flowlet));

    const pops: (Flowlet | null)[] = [];
    manager.onPop.add(flowlet => pops.push(flowlet));

    const main = manager.push(new Flowlet("main"));
    const f1 = manager.push(main.fork("f1"));
    const f2 = manager.push(main.fork("f2"));
    const p1 = manager.pop(f2);
    const f1_1 = manager.push(f1.fork("f1.1"));

    expect(f1_1.fullName).toBe("/main/f1/f1.1");

    expect(manager.top()).toStrictEqual(f1_1);
    expect(manager.pop(f1_1)).toStrictEqual(f1_1);
    expect(pushes).toStrictEqual([main, f1, f2, f1_1]);
    expect(pops).toStrictEqual([p1, f1_1])
  });

  test("test FlowletManager methods and events for async code", async () => {
    const manager = new FlowletManager();

    const pushes: Flowlet[] = [];
    manager.onPush.add(flowlet => pushes.push(flowlet));

    const pops: (Flowlet | null)[] = [];
    manager.onPop.add(flowlet => pops.push(flowlet));

    const main = manager.push(new Flowlet("main"));
    const f1 = manager.push(main.fork("f1"));
    expect(manager.top()).toStrictEqual(f1);

    const f2 = manager.push(main.fork("f2"));
    const p1 = Promise.resolve().then(() => {
      return manager.pop(f2);
    });
    expect(manager.top()).toStrictEqual(f2);

    // We pop f1, but top is f2
    expect(manager.pop(f1)).toStrictEqual(f2);
    expect(pops).toStrictEqual([f1]);
    expect(manager.top()).toStrictEqual(f2);

    expect(await p1).toStrictEqual(f2);
    expect(pops).toStrictEqual([f1, f2]);
    expect(manager.top()).toStrictEqual(main);
  });

  test("wrap/unwrap methods", () => {
    const manager = new FlowletManager();

    type Callback = () => void;
    const batchRunner = new class {
      private callbacks: Callback[] = [];
      schedule(cb: Callback) {
        this.callbacks.push(manager.wrap(cb, 'schedule'));
      }
      runall() {
        for (const cb of this.callbacks) {
          cb();
        }
      }
    }

    const f1 = manager.push(new Flowlet("f1"));
    batchRunner.schedule(() => {
      expect(manager.top()).toStrictEqual(f1);
    });

    const f2 = manager.push(f1.fork("f2"));
    batchRunner.schedule(() => {
      expect(manager.top()).toStrictEqual(f2);
    });

    manager.pop(f2);
    manager.pop(f1);

    expect(2);
    batchRunner.runall();
  });

  test("wrap callback with exception", () => {
    const manager = new FlowletManager();

    type Callback = () => void;
    const batchRunner = new class {
      private callbacks: Callback[] = [];
      schedule(cb: Callback) {
        this.callbacks.push(manager.wrap(cb, 'schedule'));
      }
      runall() {
        for (const cb of this.callbacks) {
          cb();
        }
      }
    }

    const f1 = manager.push(new Flowlet("f1"));
    const ExceptionText = "Test Exception";
    const func = () => {
      expect(manager.top()).toStrictEqual(f1);
      throw ExceptionText;
    }
    const wrapped = manager.wrap(func, 'test error');

    expect(4);

    expect(func).toThrow(ExceptionText);

    manager.push(f1.fork("f2")); // push to change the .top to ensure full logic of wrap is triggered
    expect(wrapped).toThrow(ExceptionText);
  });

});