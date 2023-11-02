/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import { intercept } from "@hyperion/hyperion-core/src/intercept";

import { Channel } from "@hyperion/hook/src/Channel";
import { ALFlowletManager } from "../src/ALFlowletManager";
import { AUTO_LOGGING_SURFACE } from "../src/ALSurfaceConsts";
import * as ALNetworkPublisher from "../src/ALNetworkPublisher";
import { initFlowletTrackers } from "@hyperion/hyperion-flowlet/src/FlowletWrappers";
import * as ALTriggerFlowlet from "../src/ALTriggerFlowlet";

describe("Network event publisher", () => {
  beforeEach(() => {
    intercept(window);
  });

  test("request / response events with right setup", (done) => {
    const flowletManager = new ALFlowletManager();
    flowletManager.push(new flowletManager.flowletCtor("top"));

    const channel = new Channel<ALNetworkPublisher.ALChannelNetworkEvent>();

    initFlowletTrackers(flowletManager);

    ALNetworkPublisher.publish({
      flowletManager,
      domSurfaceAttributeName: AUTO_LOGGING_SURFACE,
      channel,
    });

    channel.addListener('al_network_request', event => {
      event.metadata.m1 = "m1";
      expect(event.triggerFlowlet).toBeDefined();
    });

    channel.addListener('al_network_response', event => {
      event.metadata.m2 = "m2";
      expect(event.requestEvent.metadata.m1).toBe("m1");
      expect(event.metadata.m2).toBe("m2");
      console.log(event.triggerFlowlet);
      done();
    });

    const url = "https://www.example.com";
    // fetch(url).then(done);
    const xhr = new XMLHttpRequest();
    intercept(xhr);
    xhr.open('get', url);
    xhr.send();
    xhr.onload = (event) => {
      const triggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
      console.log(triggerFlowlet);
    };
    xhr.dispatchEvent(new ProgressEvent('load'));
    xhr.dispatchEvent(new ProgressEvent('loadend'));
  });
});
