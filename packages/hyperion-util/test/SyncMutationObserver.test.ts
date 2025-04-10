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

    function tag(tagName: string, attrs: Record<string, string> = {}) {
      const element = window.document.createElement(tagName);
      for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
      }
      return element;
    }

    const elem = tag("div")
    const child0 = tag("p", { id: "0" });
    const child1 = tag("a", { id: "1" });
    const child2 = tag("b", { id: "2" });

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

    const child3 = tag("span", { id: "3" });
    const child4 = tag("span", { id: "4" });

    child2.after(child3, child4);
    expectLastEventsToBe([{ action: 'added', target: elem, nodes: [child3, child4] }]);

    child2.append(child3, child4);
    expectLastEventsToBe([{ action: 'added', target: child2, nodes: [child3, child4] }]);

    child2.before(child3, child4);
    expectLastEventsToBe([{ action: 'added', target: elem, nodes: [child3, child4] }]);

    child2.prepend(child3, child4);
    expectLastEventsToBe([{ action: 'added', target: child2, nodes: [child3, child4] }]);

    child3.remove();
    expectLastEventsToBe([{ action: 'removed', target: child2, nodes: [child3] }]);

    child2.replaceChildren(child3)
    expectLastEventsToBe([
      { action: 'removed', target: child2, nodes: [child4] },
      { action: 'added', target: child2, nodes: [child3] },
    ]);

    child2.replaceWith(child4);
    expectLastEventsToBe([
      { action: 'removed', target: elem, nodes: [child2] },
      { action: 'added', target: elem, nodes: [child4] },
    ]);
  });
});

