/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";

import * as Flags from "hyperion-globals/src/Flags";

/**
 * installHandlers latches which markInteractable impl it uses on its first run, so the flag
 * has to be set before anything in ALInteractableDOMElement is touched. Jest gives each test
 * file a fresh module registry, which is why the deferred cases live in their own file.
 */
Flags.setFlags({ deferInteractabilityCheck: true });

import * as DomFragment from "./DomFragment";
import { trackAndEnableUIEventHandlers } from "../src/ALUIEventPublisher";

const EventHandlerTrackerAttribute = 'data-interactable';

/**
 * Matches the deferral in markInteractableDeferred: one animation frame, then the task it
 * posts from inside that frame. jsdom has no scheduler.postTask, so the MessageChannel
 * fallback runs; draining a few macrotask turns covers it without depending on the exact
 * ordering between task sources.
 */
async function afterNextPaint(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  for (let i = 0; i < 3; i++) {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

describe("Deferred interactability check", () => {
  beforeAll(() => {
    trackAndEnableUIEventHandlers('click', {
      captureHandler: () => { },
      bubbleHandler: () => { },
    });
    trackAndEnableUIEventHandlers('keydown', {
      captureHandler: () => { },
      bubbleHandler: () => { },
    });
  });

  test("addEventListener sets the attribute after the next paint, not synchronously", async () => {
    const dom = DomFragment.html(`<div id="deferred"></div>`);
    const node = document.getElementById("deferred")!;

    node.addEventListener("click", () => { });
    expect(node.getAttribute(EventHandlerTrackerAttribute)).toBeNull();

    await afterNextPaint();
    expect(node.getAttribute(EventHandlerTrackerAttribute)).toContain("|click|");

    dom.cleanup();
  });

  test("an immediate removeEventListener cancels the pending add", async () => {
    const dom = DomFragment.html(`<div id="add-then-remove"></div>`);
    const node = document.getElementById("add-then-remove")!;
    const listener = () => { };

    node.addEventListener("click", listener);
    node.removeEventListener("click", listener);

    await afterNextPaint();
    // The delayed add must not resurrect the attribute the remove already cleared.
    expect(node.getAttribute(EventHandlerTrackerAttribute)).toBeNull();

    dom.cleanup();
  });

  test("a remove only cancels the pending add for its own event", async () => {
    const dom = DomFragment.html(`<div id="two-events"></div>`);
    const node = document.getElementById("two-events")!;
    const listener = () => { };

    node.addEventListener("click", listener);
    node.addEventListener("keydown", listener);
    node.removeEventListener("click", listener);

    await afterNextPaint();
    const value = node.getAttribute(EventHandlerTrackerAttribute);
    expect(value).not.toContain("|click|");
    expect(value).toContain("|keydown|");

    dom.cleanup();
  });

  test("re-adding after a cancelled add schedules a fresh update", async () => {
    const dom = DomFragment.html(`<div id="add-remove-add"></div>`);
    const node = document.getElementById("add-remove-add")!;
    const listener = () => { };

    node.addEventListener("click", listener);
    node.removeEventListener("click", listener);
    node.addEventListener("click", listener);

    await afterNextPaint();
    expect(node.getAttribute(EventHandlerTrackerAttribute)).toContain("|click|");

    dom.cleanup();
  });

  test("a remove after the deferred add has landed still clears the attribute", async () => {
    const dom = DomFragment.html(`<div id="settled-then-remove"></div>`);
    const node = document.getElementById("settled-then-remove")!;
    const listener = () => { };

    node.addEventListener("click", listener);
    await afterNextPaint();
    expect(node.getAttribute(EventHandlerTrackerAttribute)).toContain("|click|");

    node.removeEventListener("click", listener);
    expect(node.getAttribute(EventHandlerTrackerAttribute)).toBeNull();

    dom.cleanup();
  });
});
