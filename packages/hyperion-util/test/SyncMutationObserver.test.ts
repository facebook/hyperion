/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
  * @jest-environment jsdom
 */

import "jest";
import { MutationEvent, onDOMMutation } from "../src/SyncMutationObserver";

describe('test sync mutation observer', () => {
  test('test sync mutation observer', () => {
    let events: MutationEvent[] = [];
    onDOMMutation.add(event => {
      events.push(event);
    })

    function expectLastEventsToBe(expectedEvents: MutationEvent[]) {
      expect(events.slice(-expectedEvents.length)).toStrictEqual(expectedEvents);
    }

    const elem = window.document.createElement("div");
    const child0 = window.document.createElement("p");
    child0.id = "0";
    const child1 = window.document.createElement("a");
    child1.id = "1";
    const child2 = window.document.createElement("b");
    child2.id = "2";

    elem.innerHTML = "<p><b>test</b></p>"; // 2 events
    expectLastEventsToBe([
      { action: 'removed', target: elem, nodes: [] },
      { action: 'added', target: elem, nodes: [...elem.childNodes] }
    ]);

    elem.appendChild(child0);
    expectLastEventsToBe([{ action: 'added', target: elem, nodes: [child0] }]);

    child0.appendChild(child1);
    expectLastEventsToBe([{ action: 'added', target: child0, nodes: [child1] }]);

    child0.replaceChild(child2, child1);
    expectLastEventsToBe([
      { action: 'removed', target: child0, nodes: [child1] },
      { action: 'added', target: child0, nodes: [child2] }
    ]);

    child0.removeChild(child2);
    expectLastEventsToBe([{ action: 'removed', target: child0, nodes: [child2] }]);

    elem.insertBefore(child1, child0);
    expectLastEventsToBe([{ action: 'added', target: elem, nodes: [child1] }]);

    elem.insertAdjacentElement('beforeend', child2);
    expectLastEventsToBe([{ action: 'added', target: elem, nodes: [child2] }]);

    expect(elem.outerHTML).toBe('<div><p><b>test</b></p><a id="1"></a><p id="0"></p><b id="2"></b></div>');
  })
})