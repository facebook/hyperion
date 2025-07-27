/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import * as ALEventExtension from "hyperion-autologging/src/ALEventExtension";
import { ALNetworkResponseEvent } from "hyperion-autologging/src/ALNetworkPublisher";
import type { ALChannelEvent } from "hyperion-autologging/src/AutoLogging";
import { Channel } from "hyperion-channel";
import { assert } from "hyperion-globals";
import { TimedTrigger } from "hyperion-timed-trigger/src/TimedTrigger";

export function init(channel: Channel<ALChannelEvent>): void {

  const urls = new Map<string, ALNetworkResponseEvent>();
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      assert(entry.entryType === 'resource', "Unexpected entry type!");
      const url = entry.name;
      const response = urls.get(url);
      if (response) {
        ALEventExtension.setEventExtension(response, 'perf', entry);
        urls.delete(url);
      }
    }
  });
  observer.observe({ entryTypes: ['resource'] });

  const cleaner = new TimedTrigger(() => {
    urls.clear();
  }, 1000 * 60); // Clear every  minutes

  channel.addListener('al_network_response', eventData => {
    urls.set(eventData.requestEvent.url, eventData);
    if (cleaner.isDone()) {
      cleaner.restart();
    } else {
      cleaner.delay();
    }
  });

}