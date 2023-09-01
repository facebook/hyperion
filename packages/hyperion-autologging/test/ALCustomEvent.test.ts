/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";

import { Channel } from "@hyperion/hook/src/Channel";
import { ALFlowletManager } from "../src/ALFlowletManager";
import { AUTO_LOGGING_SURFACE } from "../src/ALSurfaceConsts";
import * as ALCustomEvent from "../src/ALCustomEvent";
import * as DomFragment from "./DomFragment";

describe("emit custom events", () => {
  test("emit with metadata", () => {
    const flowletManager = new ALFlowletManager();

    const channel = new Channel<ALCustomEvent.ALChannelCustomEvent>();

    const metadata = {
      foo: 'bar'
    }
      ;
    channel.addListener('al_custom_event', event => {
      expect(event.metadata).toStrictEqual(metadata);
    });

    ALCustomEvent.emitALCustomEvent(channel, flowletManager, metadata);
  });
});