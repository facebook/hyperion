/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { createALHeartbeatController } from '../src/ALHeartbeatController';
import { ALHeartbeatType } from '../src/ALHeartbeatType';

describe('ALHeartbeatController', () => {
  test('owns shared inactivity and activity semantics', () => {
    let now = 100;
    let lastActivity = now;
    let lastHeartbeatTime = 0;
    const emitted: [ALHeartbeatType, number][] = [];
    const emitHeartbeat = createALHeartbeatController(
      20,
      (type, timestamp) => {
        emitted.push([type, timestamp]);
        lastHeartbeatTime = timestamp;
      },
      () => lastActivity
    );

    emitHeartbeat(ALHeartbeatType.START, now);
    expect(emitted).toEqual([[ALHeartbeatType.START, 100]]);

    now = 110;
    emitHeartbeat(ALHeartbeatType.SCHEDULED, now);
    expect(emitted.at(-1)).toEqual([ALHeartbeatType.SCHEDULED, 110]);
    expect(lastHeartbeatTime).toBe(110);

    now = 131;
    emitHeartbeat(ALHeartbeatType.SCHEDULED, now);
    expect(emitted).toHaveLength(2);
    expect(lastHeartbeatTime).toBe(110);

    lastActivity = now;
    emitHeartbeat(ALHeartbeatType.SCHEDULED, now);
    expect(emitted.at(-1)).toEqual([ALHeartbeatType.SCHEDULED, 131]);

    emitHeartbeat(ALHeartbeatType.STOP, now);
    expect(emitted.at(-1)).toEqual([ALHeartbeatType.STOP, 131]);
  });

  test('supports external activity state and paused platform lifecycles', () => {
    let now = 1_000;
    let lastActivity = now;
    const emitted: ALHeartbeatType[] = [];
    const emitHeartbeat = createALHeartbeatController(
      120,
      (type) => emitted.push(type),
      () => lastActivity
    );

    emitHeartbeat(ALHeartbeatType.START, now);

    now += 45;
    lastActivity = now;
    expect(lastActivity).toBe(now);
    emitHeartbeat(ALHeartbeatType.REGAIN_PAGE_VISIBILITY, now);
    expect(emitted).toEqual([
      ALHeartbeatType.START,
      ALHeartbeatType.REGAIN_PAGE_VISIBILITY,
    ]);
  });

  test('does not advance heartbeat state when strict delivery throws', () => {
    let failingType: ALHeartbeatType | null = ALHeartbeatType.START;
    let lastHeartbeatTime = 0;
    const emitHeartbeat = createALHeartbeatController(
      40,
      (type, timestamp) => {
        if (type === failingType) throw new Error(`${type} failed`);
        lastHeartbeatTime = timestamp;
      },
      () => 100
    );

    expect(() => emitHeartbeat(ALHeartbeatType.START, 100)).toThrow(
      'START failed'
    );
    expect(lastHeartbeatTime).toBe(0);

    failingType = null;
    emitHeartbeat(ALHeartbeatType.START, 100);
    failingType = ALHeartbeatType.STOP;
    expect(() => emitHeartbeat(ALHeartbeatType.STOP, 100)).toThrow(
      'STOP failed'
    );
    expect(lastHeartbeatTime).toBe(100);
  });
});
