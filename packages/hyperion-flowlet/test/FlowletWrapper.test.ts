/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 * @jest-environment jsdom
*/

import { AsyncCounter } from "@hyperion/global/src/AsyncCounter";
import "jest";
import { Flowlet } from "../src/Flowlet";
import { FlowletManager } from "../src/FlowletManager";
import { initFlowletTrackers } from "../src/FlowletWrappers";
import { getTriggerFlowlet } from "../src/TriggerFlowlet";



describe("test flow of flowlets", () => {
  const flowletManager = new FlowletManager(Flowlet);

  beforeAll(() => {
    initFlowletTrackers(flowletManager);

  })

  beforeEach(() => {
    if (!window.Worker) {
      window.Worker = <any>{}; // Just so jest does not fail
    }
  });

  function expectTopToForkFrom(manager: FlowletManager, flowlet: Flowlet) {
    expect(manager.top() === flowlet || manager.top()?.parent === flowlet).toBe(true);
  }

  test("test FlowletManager methods and events", async () => {
    const manager = flowletManager;
    const main = manager.top() ?? manager.push(new Flowlet("main"));
    const counter = new AsyncCounter(0);

    const id = setInterval(
      () => { // async step 1
        if (counter.getCount() > 3) {
          return; // enough flow creation!
        }
        expectTopToForkFrom(manager, main);
        const currFlow = manager.push(main.fork("flow_" + counter.countUp().getCount())); // start a new flow
        {
          const div = window.document.createElement("div");
          div.id = currFlow.getFullName();
          window.document.body.appendChild(div);

          function createFlow(flowName: string) {
            return (ev: MouseEvent) => {
              expectTopToForkFrom(manager, currFlow);
              const clickFlow = manager.push(currFlow.fork(flowName));
              {
                Promise.resolve().then(() => { //async step 2
                  expectTopToForkFrom(manager, clickFlow);
                  counter.countDown();
                });
              }
              expect(manager.pop(clickFlow)).toStrictEqual(clickFlow);
            }
          }

          div.addEventListener("click", createFlow("click1"));
          div.addEventListener("click", createFlow("click2"));

          setTimeout(
            () => { // async step 3
              div.dispatchEvent(new MouseEvent("click"));
            },
            50
          );
        }
        expect(manager.pop(currFlow)).toStrictEqual(currFlow);
      },
      10
    );

    expect(manager.pop(main)).toBe(main);
    expect(manager.top()).toBe(manager.root);

    const r = await counter.reachTarget();
    clearInterval(id);
    expect(r).toBe(0);
  });

  test("add/remove listeners", async () => {
    const main = flowletManager.top() ?? flowletManager.push(new Flowlet("main"));

    const div = window.document.createElement("div");
    div.id = main.getFullName();
    window.document.body.appendChild(div);


    const counter1 = new AsyncCounter(2);
    const listener0 = {
      handleEvent() {
        counter1.countUp();
      }
    }
    const listener1 = () => {
      counter1.countUp();
    };

    const counter2 = new AsyncCounter(2);
    const listener2 = () => {
      counter2.countUp();
    };

    div.addEventListener("click", listener0);
    div.addEventListener("click", listener1);
    div.addEventListener("click", listener2);

    div.dispatchEvent(new MouseEvent("click"));
    const r1 = await counter1.reachTarget();
    expect(r1).toBe(2);
    expect(counter1.getCount()).toBe(2);
    expect(counter2.getCount()).toBe(1);

    div.removeEventListener("click", listener0);
    div.removeEventListener("click", listener1);

    div.dispatchEvent(new MouseEvent("click"));
    const r2 = await counter2.reachTarget();
    expect(r2).toBe(2);
    expect(counter1.getCount()).toBe(2); // Should not have run again
    expect(counter2.getCount()).toBe(2);
  });

  test("Promise trigger flowlet", async () => {
    const main = flowletManager.top() ?? flowletManager.push(new Flowlet("main"));
    const tf = new flowletManager.flowletCtor("tf");
    main.data.triggerFlowlet = tf;
    const p0 = new Promise(resolve => resolve(0));
    expect(getTriggerFlowlet(p0)).toBe(tf);

    const p1 = Promise.resolve(1);
    expect(getTriggerFlowlet(p1)).toBe(tf);

    const all = Promise.all([p0, p1]);
    expect(getTriggerFlowlet(all)?.getFullName()).toMatch(/Promise.all\(\d+,\d+\)/);

    const race = Promise.race([p0, p1]);
    expect(getTriggerFlowlet(race)?.getFullName()).toMatch(/Promise.race\(\d+,\d+\)/);

    let p2;
    try { // Need try/catch to handle reject
      p2 = Promise.reject(2);
    } catch {
    } finally {
      expect(getTriggerFlowlet(p2)).toBe(tf);
    }
    const allSettled = Promise.allSettled([p0, p1, p2]);
    expect(getTriggerFlowlet(allSettled)?.getFullName()).toMatch(/Promise.allSettled\(\d+,\d+,\d+\)/);
  });
});