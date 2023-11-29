/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { Flowlet } from "../src/Flowlet";

import { FlowletManager } from "../src/FlowletManager";

describe("test FlowletManager", () => {
  jest.useFakeTimers();

  test("test FlowletManager methods and events", () => {
    const manager = new FlowletManager(Flowlet);

    const pushes: Flowlet[] = [];
    manager.onPush.add(flowlet => pushes.push(flowlet));

    const pops: (Flowlet | null)[] = [];
    manager.onPop.add(flowlet => pops.push(flowlet));

    const main = manager.push(new Flowlet("main"));
    const f1 = manager.push(main.fork("f1"));
    const f2 = manager.push(main.fork("f2"));
    const p1 = manager.pop(f2);
    const f1_1 = manager.push(f1.fork("f1.1"));

    expect(f1_1.getFullName()).toBe("/main/f1/f1.1");

    expect(manager.top()).toStrictEqual(f1_1);
    expect(manager.pop(f1_1)).toStrictEqual(f1_1);
    expect(pushes).toStrictEqual([main, f1, f2, f1_1]);
    expect(pops).toStrictEqual([p1, f1_1])
  });

  test("test FlowletManager methods and events for async code", async () => {
    const manager = new FlowletManager(Flowlet);

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
    manager.onPop.add(
      (flowlet, succeeded) => {
        expect(flowlet).toStrictEqual(f1);
        expect(succeeded).toBe(false);
      },
      true
    );
    expect(manager.pop(f1)).toStrictEqual(f2); // don't expect anything to be popped.
    expect(pops).toStrictEqual([f1]);
    expect(manager.top()).toStrictEqual(f2);

    expect(manager.stackSize()).toBe(3);
    expect(await p1).toStrictEqual(f2);
    expect(pops).toStrictEqual([f1, f2]);
    expect(manager.stackSize()).toBe(2);
    // expect(manager.top()).toStrictEqual(main); // Since out of order pop no longer works, we don't expect this.
  });

  test("wrap/unwrap methods", () => {
    const manager = new FlowletManager(Flowlet);

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
      expect(manager.top()?.parent).toStrictEqual(f1);
    });

    const f2 = manager.push(f1.fork("f2"));
    batchRunner.schedule(() => {
      expect(manager.top()?.parent).toStrictEqual(f2);
    });

    manager.pop(f2);
    manager.pop(f1);

    expect(2);
    batchRunner.runall();
  });

  test("wrap callback with exception", () => {
    const manager = new FlowletManager(Flowlet);

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
      expect(manager.top() === f1 || manager.top()?.parent === f1).toBe(true);
      throw ExceptionText;
    }
    const wrapped = manager.wrap(func, 'test error');

    expect(4);

    expect(func).toThrow(ExceptionText);

    manager.push(f1.fork("f2")); // push to change the .top to ensure full logic of wrap is triggered
    expect(wrapped).toThrow(ExceptionText);
  });

  test("push with fork reason", () => {
    const manager = new FlowletManager(Flowlet);

    const f1 = manager.push(new Flowlet("f1"));
    expect(manager.top()).toStrictEqual(f1);
    const f2 = new Flowlet("f2");
    const f2_child = manager.push(f2, "reason1");
    expect(f2_child.parent).toStrictEqual(f2);
  });


  test("Extending Flowlet & FlowletManager", () => {
    class TestFlowlet extends Flowlet {
    }
    class TestFlowletManager extends FlowletManager<TestFlowlet> {
    }
    const manager = new TestFlowletManager(TestFlowlet);

    const f1 = new TestFlowlet("f1");
    expect(f1).toBeInstanceOf(TestFlowlet);

    const f2 = manager.flowletCtor ? new manager.flowletCtor("f2") : null;
    expect(f2).toBeInstanceOf(TestFlowlet);

    const f3 = manager.push(f1, "reason1");
    expect(f3).toBeInstanceOf(TestFlowlet);
  });

  test("cleanup logic", () => {
    const manager = new FlowletManager(Flowlet);

    const main = manager.push(new Flowlet("main"));

    manager.onPush.add((flowlet, reason, replacement) => {
      expect(flowlet.name).toBe("f1");
      expect(replacement?.parent).toStrictEqual(flowlet);
    }, true);
    const f1 = manager.push(main.fork("f1"), 'test');

    const f2 = manager.push(main.fork("f2"));

    manager.onPop.add((flowlet, succeed) => {
      expect(flowlet).toStrictEqual(f1);
      expect(succeed).toStrictEqual(false);
    }, true);
    const p1 = manager.pop(f1);
    expect(p1).toStrictEqual(f2);

    expect(manager.stackSize()).not.toBe(0);
    manager.cleanup(true);
    // jest.runAllTimers();
    expect(manager.stackSize()).toBe(0);
  });

  test("mark function", () => {
    const manager = new FlowletManager(Flowlet);

    const main = manager.push(new Flowlet("main"));

    const bar = () => {
      expect(manager.top()?.getFullName()).toBe('/main/foo');
    };

    const foo = () => {
      bar();
    };

    const markedFoo = manager.mark(foo, () => 'foo');

    markedFoo();
  });

  test("mark function with dynamic flowlet name", () => {
    const manager = new FlowletManager(Flowlet);
    const main = manager.push(new Flowlet("main"));

    const bar = (param) => {
      if (param === 'foo') {
        expect(manager.top()?.getFullName()).toBe(`/main/foo`);
      } else if (param === 'foobar') {
        expect(manager.top()?.getFullName()).toBe(`/main/foobar`);
      } else {
        expect(false).toBeTruthy();
      }
    };
    const foo = (param) => {
      bar(param);
    };

    const getFlowletName = (param) => param;
    const markedFoo = manager.mark(foo, getFlowletName);

    markedFoo('foo');
    markedFoo('foobar');
  });
});