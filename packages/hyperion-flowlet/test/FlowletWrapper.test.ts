/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 * @jest-environment jsdom
*/

import { AsyncCounter } from "hyperion-async-counter/src/AsyncCounter";
import "jest";
import { Flowlet } from "../src/Flowlet";
import { FlowletManager } from "../src/FlowletManager";
import { initFlowletTrackers } from "../src/FlowletWrappers";
import { getTriggerFlowlet, setTriggerFlowlet } from "../src/TriggerFlowlet";



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

    const all1 = Promise.all([p0]);
    expect(getTriggerFlowlet(all1)).toStrictEqual(getTriggerFlowlet(p0)); // special case, pass TF of input argument

    const allSame = Promise.all([p0, p1]);
    expect(getTriggerFlowlet(allSame)?.getFullName()).toMatch(/Promise.all\(\d+\)/); // all TF collapse to one

    let p2;
    try { // Need try/catch to handle reject
      p2 = Promise.reject(2);
    } catch {
    } finally {
      expect(getTriggerFlowlet(p2)).toBe(tf);
    }

    main.data.triggerFlowlet = new flowletManager.flowletCtor("tf2");
    const p3 = Promise.resolve(2);

    const all = Promise.all([p0, p1, p3]);
    expect(getTriggerFlowlet(all)?.getFullName()).toMatch(/Promise.all\(\d+&\d+\)/); // p0 and p1 have the same TF, P3 has a new one

    const race = Promise.race([p0, p1, p3]);
    expect(getTriggerFlowlet(race)?.getFullName()).toMatch(/Promise.race\(\d+&\d+\)/);

    const allSettled = Promise.allSettled([p0, p1, p2, p3]);
    expect(getTriggerFlowlet(allSettled)?.getFullName()).toMatch(/Promise.allSettled\(\d+&\d+\)/);

    const allTooMany = Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
        const p = Promise.resolve(n);
        setTriggerFlowlet(p, new flowletManager.flowletCtor("tf" + n));
        return p;
      })
    );
    expect(getTriggerFlowlet(allTooMany)?.getFullName()).toMatch(/Promise.all\((\d+&){4}\d+...\)/); // beyond 5th one skipped
  });

  test("Trigger flowlet propagation", (done) => {
    const main = flowletManager.top() ?? flowletManager.push(new Flowlet("main"));
    const tf1 = new flowletManager.flowletCtor("tf1");
    main.data.triggerFlowlet = tf1;

    const div1 = document.createElement("div");
    document.body.appendChild(div1);
    const div2 = document.createElement("div");
    div1.appendChild(div2);

    const tf2 = new Flowlet("tf2");
    tf2.data.triggerFlowlet = tf2;
    div1.addEventListener('click', event => {
      setTriggerFlowlet(event, tf2);
    }, true);

    div2.addEventListener("click", event => {
      setTimeout(() => {
        Promise.resolve().then(() => {
          const top = flowletManager.top();
          console.log("Top: ", top.getFullName());
          const tf = top.data.triggerFlowlet;
          console.log("TF: ", tf?.getFullName());
          expect(tf).toStrictEqual(tf2);
          done();
        });
      }, 50);
    });

    div2.dispatchEvent(new MouseEvent("click"));
  });
});