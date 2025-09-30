/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";

import { Channel } from "hyperion-channel/src/Channel";
import * as ALCustomEvent from "../src/ALCustomEvent";

describe("emit custom events", () => {
  test("emit with metadata", () => {

    const channel = new Channel<ALCustomEvent.ALChannelCustomEvent>();

    const metadata = {
      foo: 'bar'
    }
      ;
    channel.addListener('al_custom_event', event => {
      expect(event.metadata).toStrictEqual(metadata);
    });

    ALCustomEvent.emitALCustomEvent(channel, metadata);
  });
});