/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import { ALMetadataEvent, ALPageEvent, ALTimedEvent } from "hyperion-autologging/src/ALType";
import { Channel } from "hyperion-channel";
import * as Types from "hyperion-util/src/Types";
import { PluginInit } from "hyperion-autologging/src/AutoLogging";
import performanceAbsoluteNow from "hyperion-util/src/performanceAbsoluteNow";
import { getCurrMainPageUrl } from "hyperion-autologging/src/MainPageUrl";


export type ALFPSEventData = ALTimedEvent & ALPageEvent & ALMetadataEvent & Readonly<{
  fps: number;
  fpsThreshold: number;
}>;

export type ALChannelFPSEvent = Readonly<{
  al_fps_event: [ALFPSEventData],
}>;

export type ALFPSChannel = Channel<ALChannelFPSEvent>;

export type InitOptions = Types.Options<{
  /// The channel to emit FPS events on
  channel: ALFPSChannel;
  /// The minimum FPS threshold to trigger an event
  minFPSThreshold: number;
}>;

export function init(options: InitOptions): PluginInit {
  return (_pluginChannel) => {
    let frames = 0;
    let lastFrameTime = 0
    function measureFPS(timestamp: number): void {
      frames++;
      let currentFrameTime = timestamp; // performance.now();
      let delta = currentFrameTime - lastFrameTime;
      if (delta > 1000) {
        const fps = frames / (delta / 1000);
        if (fps < options.minFPSThreshold) {
          // console.warn(`FPS dropped below threshold: ${fps} < ${options.minFPSThreshold}`);
          options.channel.emit('al_fps_event', {
            eventTimestamp: performanceAbsoluteNow(),
            pageURI: getCurrMainPageUrl(),
            fps,
            fpsThreshold: options.minFPSThreshold,
            metadata: {}
          });
        }
        lastFrameTime = currentFrameTime;
        frames = 0;
      }
      window.requestAnimationFrame(measureFPS);
    }
    measureFPS(performance.now());
  };
}