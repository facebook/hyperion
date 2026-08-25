/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  ALSurfaceMutationEventBase,
  ALSurfaceMutationEventWithElement,
} from '../src/ALSurfaceContract';
import { ALHeartbeatType } from '../src/ALHeartbeatType';

const sourceDirectory = resolve(__dirname, '../src');

describe('shared AutoLogging contracts', () => {
  test('keeps the established heartbeat vocabulary', () => {
    expect(Object.values(ALHeartbeatType)).toEqual([
      'REGAIN_PAGE_VISIBILITY',
      'PAGE_FOCUS_GAINED',
      'PAGE_FOCUS_LOST',
      'SCHEDULED',
      'START',
      'STOP',
    ]);
  });

  test('supports element-free and required-element surface specializations', () => {
    const mobileEvent: ALSurfaceMutationEventBase<{ id: string }> = {
      event: 'mount_component',
      eventTimestamp: 1,
      eventIndex: 0,
      metadata: {},
      surface: '/mobile',
      surfaceData: { id: 'mobile' },
    };
    const webElement = { id: 'web-element' };
    const webEvent: ALSurfaceMutationEventWithElement<
      { id: string },
      typeof webElement,
      string
    > = {
      event: 'mount_component',
      eventTimestamp: 2,
      eventIndex: 1,
      metadata: {},
      surface: '/web',
      surfaceData: { id: 'web' },
      element: webElement,
    };

    expect('element' in mobileEvent).toBe(false);
    expect(webEvent.element).toBe(webElement);
  });

  test('keeps neutral modules within the neutral dependency boundary', () => {
    const expectedImports: Record<string, string[]> = {
      'ALCommonTypes.ts': [],
      'ALEventFactory.ts': ['./ALCommonTypes'],
      'ALHeartbeatType.ts': ['./ALCommonTypes'],
      'ALSurfaceContract.ts': ['./ALCommonTypes', './ALSurfaceHierarchy'],
      'ALSurfaceHierarchy.ts': [],
    };

    for (const [fileName, expected] of Object.entries(expectedImports)) {
      const source = readFileSync(resolve(sourceDirectory, fileName), 'utf8');
      const imports = Array.from(
        source.matchAll(/(?:\bfrom\s+|\bimport\s*)['"]([^'"]+)['"]/g),
        (match) => match[1]
      ).sort();
      expect(imports).toEqual(expected);
      expect(source).not.toMatch(/\b(?:document|window)\b/);
    }
  });
});
