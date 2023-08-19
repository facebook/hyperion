/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";

import { Channel } from "@hyperion/hook/src/Channel";
import { ALFlowletManager } from "../src/ALFlowletManager";
import { AUTO_LOGGING_SURFACE } from "../src/ALSurfaceConsts";
import * as ALUIEventPublisher from "../src/ALUIEventPublisher";
import * as DomFragment from "./DomFragment";

describe("UI event publisher", () => {
  test("meta data transfer between capture and bubble", (done) => {
    const flowletManager = new ALFlowletManager();

    const channel = new Channel<ALUIEventPublisher.ALChannelUIEvent>();

    ALUIEventPublisher.publish({
      flowletManager,
      domSurfaceAttributeName: AUTO_LOGGING_SURFACE,
      channel,
      uiEvents: [
        {
          cacheElementReactInfo: true,
          eventName: 'click',
        }
      ]
    });

    channel.addListener('al_ui_event_capture', event => {
      event.metadata.m1 = "m1";
    });

    channel.addListener('al_ui_event_bubble', event => {
      event.metadata.m2 = "m2";
    });

    channel.addListener('al_ui_event', event => {
      expect(event.metadata.m1).toBe("m1");
      expect(event.metadata.m2).toBe("m2");
      done();
    });

    const dom = DomFragment.html(`
  <div id='1' onclick="void 0;">
    <span id='2'>"test2"</span>
  </div>
`);

    const event = new MouseEvent('click', { bubbles: true });
    document.getElementById("2")?.dispatchEvent(event);

  });
});