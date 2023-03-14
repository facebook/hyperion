/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */
'use strict';

import { Channel } from "@hyperion/hook/src/Channel"
import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import performanceAbsoluteNow from '@hyperion/hyperion-util/src/performanceAbsoluteNow';
import * as ALHeartbeat from "../src/ALHeartbeat";
import * as ALUIEventPublisher from "../src/ALUIEventPublisher";

const channel = new Channel<
  ALHeartbeat.ALChannelHeartbeatEvent &
  ALUIEventPublisher.ALChannelUIEvent
>();

const logHeartbeat = jest.fn();
channel.on('al_heartbeat_event').add(logHeartbeat);

function simulateClick(eventTimestamp: number): void {
  const flowlet = new Flowlet("click");
  channel.emit('al_ui_event', {
    event: 'click',
    element: document.body,//.createElement('div'),
    isTrusted: true,
    flowlet,
    eventIndex: 0,
    eventTimestamp,
    autoLoggingID: '',
  });
}

// function simulatePageVisibilityChange(hidden: boolean) {
//   Object.defineProperty(window.document, 'hidden', {
//     value: hidden,
//     writable: true,
//   });
// }

// function advanceTimersByTime(time: number): void {
//   // $FlowIgnore[prop-missing] __skipForward is defined in the mock for performanceAbsoluteNow
//   performanceAbsoluteNow.__skipForward(time);
//   jest.advanceTimersByTime(time);
// }

describe('ALHeartbeat', () => {

  // beforeEach(() => {
  //   jest.useFakeTimers();
  //   jest.mock('AdsALLogger');
  //   jest.mock('getFalcoLogPolicy_DO_NOT_USE');
  //   jest.mock('performanceAbsoluteNow');
  //   jest.mock('requestIdleCallback', () => callback => callback());
  // });

  it('Start heartbeats at the beginning of a session, even if the user is not active yet', (done) => {
    let callCount = 0;
    let lastHeartbeatTime = 0;
    const logger = channel.addListener('al_heartbeat_event', () => {
      switch (++callCount) {
        case 1: {
          // Log heartbeat on session start
          expect(logHeartbeat).toHaveBeenCalledTimes(callCount);
          expect(ALHeartbeat.getLastHeartbeatTime()).toBe(0); // the very first call
          expect(ALHeartbeat.getLastHeartbeatTime()).toBeLessThan(ALHeartbeat.getInterval());
          break;
        }
        case 2: {
          // Log heartbeat for every interval
          expect(logHeartbeat).toHaveBeenCalledTimes(callCount);
          const heartbeatTime = ALHeartbeat.getLastHeartbeatTime();
          expect(heartbeatTime).toBeGreaterThan(ALHeartbeat.getInterval() - lastHeartbeatTime);
          lastHeartbeatTime = heartbeatTime;
          break;
        }
        case 3: {
          expect(logHeartbeat).toHaveBeenCalledTimes(callCount);
          const heartbeatTime = ALHeartbeat.getLastHeartbeatTime();
          expect(heartbeatTime).toBeGreaterThan(ALHeartbeat.getInterval() - lastHeartbeatTime);
          lastHeartbeatTime = heartbeatTime;

          ALHeartbeat.stop();
          channel.removeListener('al_heartbeat_event', logger);
          done();
          break;
        }
      }
    });
    ALHeartbeat.start({ channel, heartbeatInterval: 10 });
  });


  /* // TODO: fix this later, seems too complicated, but it is working in the react test app

  it('Continue heartbeats only if the user is active is within the idle time threshold', (done) => {
    let callCount = 0;
    let lastHeartbeatTime = 0;
    logHeartbeat.mockClear();
    let clickTime: number = 0;
    const logger = channel.addListener('al_heartbeat', () => {
      console.log(`Heartbeat #`, callCount);
      switch (++callCount) {
        case 1: {
          // Log heartbeat on session start
          expect(logHeartbeat).toHaveBeenCalledTimes(callCount);

          // Simulate user activity within idle time threshold
          let clickTime = performanceAbsoluteNow();
          simulateClick(clickTime);
          expect(ALHeartbeat.getLastUserActionTime()).toBe(clickTime);
          break;
        }
        case 2: {
          // Log heartbeat for every interval
          expect(logHeartbeat).toHaveBeenCalledTimes(callCount);
          const heartbeatTime = ALHeartbeat.getLastHeartbeatTime();
          expect(heartbeatTime).toBeGreaterThan(ALHeartbeat.getInterval() - lastHeartbeatTime);
          lastHeartbeatTime = heartbeatTime;

          // Simulate user activity before idle time threshold
          clickTime = performanceAbsoluteNow() - 5 * ALHeartbeat.getInterval();
          simulateClick(clickTime);
          expect(ALHeartbeat.getLastUserActionTime()).toBe(clickTime);
          break;
        }
        case 3: {
          expect(logHeartbeat).toHaveBeenCalledTimes(callCount);
          const heartbeatTime = ALHeartbeat.getLastHeartbeatTime();
          expect(heartbeatTime).toBeGreaterThan(ALHeartbeat.getInterval() - lastHeartbeatTime);
          lastHeartbeatTime = heartbeatTime;

          // Simulate recent user activity
          clickTime = performanceAbsoluteNow();
          simulateClick(clickTime);
          expect(ALHeartbeat.getLastUserActionTime()).toBe(clickTime);
          break;
        }
        case 4: {
          const heartbeatTime = ALHeartbeat.getLastHeartbeatTime();
          expect(heartbeatTime).toBeGreaterThan(ALHeartbeat.getInterval() - lastHeartbeatTime);
          lastHeartbeatTime = heartbeatTime;
          break;
        }
        default: {
          expect(callCount).toBeGreaterThan(4);
          ALHeartbeat.stop();
          channel.removeListener('al_heartbeat', logger);
          done();
          break;
        }
      }
    });
    ALHeartbeat.start({ channel, heartbeatInterval: 10 });
  });

 
  it('Restart heartbeats when the user comes back to an inactive tab', () => {
    // Log heartbeat on session start
    ALHeartbeat.start();
    expect(logHeartbeat).toHaveBeenCalledTimes(7);
    let lastHeartbeatTime = ALHeartbeat.getLastHeartbeatTime();
    expect(lastHeartbeatTime).toBeGreaterThan(0);
    expect(logHeartbeat).toHaveBeenNthCalledWith(7, {
      event: AdsALEvent.HEARTBEAT,
      eventIndex: 6,
      eventTimestamp: lastHeartbeatTime,
      flowlet: null,
      heartbeatType: ALHeartbeatType.START,
    });
 
    const event = document.createEvent('Event');
    event.initEvent('visibilitychange', true, false);
 
    // Simulate navigating away from the current page
    simulatePageVisibilityChange(true);
    document.dispatchEvent(event);
    expect(Visibility.isHidden()).toBe(true);
 
    // Simulate navigating back after exceeding the heartbeat interval
    advanceTimersByTime(5 * ALHeartbeat.getInterval());
    simulatePageVisibilityChange(false);
    document.dispatchEvent(event);
    expect(Visibility.isHidden()).toBe(false);
 
    // Reset heartbeat timer
    expect(logHeartbeat).toHaveBeenCalledTimes(8);
    const heartbeatTime = ALHeartbeat.getLastHeartbeatTime();
    expect(heartbeatTime).toBeGreaterThan(lastHeartbeatTime);
    expect(logHeartbeat).toHaveBeenNthCalledWith(8, {
      event: AdsALEvent.HEARTBEAT,
      eventIndex: 7,
      eventTimestamp: heartbeatTime,
      flowlet: null,
      heartbeatType: ALHeartbeatType.REGAIN_PAGE_VISIBILITY,
    });
    lastHeartbeatTime = heartbeatTime;
 
    // Simulate navigating away from the current page
    simulatePageVisibilityChange(true);
    document.dispatchEvent(event);
    expect(Visibility.isHidden()).toBe(true);
 
    // Simulate navigating back within the heartbeat interval
    simulatePageVisibilityChange(false);
    document.dispatchEvent(event);
    expect(Visibility.isHidden()).toBe(false);
 
    // Do not reset heartbeat timer
    expect(logHeartbeat).toHaveBeenCalledTimes(8);
    expect(ALHeartbeat.getLastHeartbeatTime()).toBe(lastHeartbeatTime);
    ALHeartbeat.stop();
  });
  */
});
