/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";

import { Channel } from "@hyperion/hyperion-channel/src/Channel";
import { ALFlowletManager } from "../src/ALFlowletManager";
import * as ALUIEventPublisher from "../src/ALUIEventPublisher";
import * as DomFragment from "./DomFragment";
import * as  ALDOMSnapshotPublisher from "../src/ALDOMSnaptshotPublisher";
import { ALChannelCustomEvent } from "../src/ALCustomEvent";

describe("dom snapshot publisher", () => {
  test("dom snapshot taken for clicks", (done) => {
    const flowletManager = new ALFlowletManager();

    const channel = new Channel<ALDOMSnapshotPublisher.ALChannelDOMSnapshotPublisherEvent>();

    ALUIEventPublisher.publish({
      flowletManager,
      channel,
      uiEvents: [
        {
          cacheElementReactInfo: true,
          eventName: 'click',
        }
      ]
    });
    ALDOMSnapshotPublisher.publish({
      flowletManager,
      channel,
      eventConfig: ['al_ui_event'],
    })

    let uiEventData;

    channel.addListener('al_ui_event', event => {
      uiEventData = event;
    });

    const dom = DomFragment.html(`
  <div id='1' onclick="void 0;">
    <span id='2'>"test2"</span>
  </div>
`);

    channel.addListener('al_custom_event', eventData => {
      if (eventData.metadata.event_name === 'dom_snapshot') {
        const snapshot = eventData.metadata.snapshot;
        expect(snapshot).toMatch(/div id=.1/);
        expect(snapshot).toMatch(/span id=.2/);
        done();
      }
    });


    const event = new MouseEvent('click', { bubbles: true });
    document.getElementById("2")?.dispatchEvent(event);

  });
});
