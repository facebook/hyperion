/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 * @jest-environment jsdom
*/

import { AsyncCounter } from "@hyperion/global/src/AsyncCounter";
import "jest";
import { Flowlet } from "../src/Flowlet";
import { FlowletManager } from "../src/FlowletManager";
import { initFlowletTrackers } from "../src/FlowletWrappers";



describe("test flow of flowlets", () => {
  beforeEach(() => {
    if (!window.Worker) {
      window.Worker = <any>{}; // Just so jest does not fail
    }
  });

  function expectTopToForkFrom(manager: FlowletManager, flowlet: Flowlet) {
    expect(manager.top() === flowlet || manager.top()?.parent === flowlet).toBe(true);
  }

  test("test FlowletManager methods and events", async () => {
    const manager = new FlowletManager(Flowlet);
    const main = manager.push(new Flowlet("main"));
    const counter = new AsyncCounter(0);

    initFlowletTrackers(manager);

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
    expect(manager.top()).toBe(null);

    const r = await counter.reachTarget();
    clearInterval(id);
    expect(r).toBe(0);
  });

  test("add/remove listeners", async () => {
    const manager = new FlowletManager(Flowlet);
    const main = manager.push(new Flowlet("main"));
    initFlowletTrackers(manager);

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
  })
});