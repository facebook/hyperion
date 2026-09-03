/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

jest.mock('hyperion-util/src/guid', () => ({
  guid: () =>
    (
      globalThis as typeof globalThis & {
        __hyperionMockGuidValue?: string;
      }
    ).__hyperionMockGuidValue ?? 'f12345000',
}));

import { getSessionId, resetSessionForTests } from '../src/ALSession';

describe('mobile AutoLogging identifiers', () => {
  const mockState = globalThis as typeof globalThis & {
    __hyperionMockGuidValue?: string;
  };

  afterEach(() => {
    delete mockState.__hyperionMockGuidValue;
  });

  it('uses the complete GUID entropy to produce six base-36 characters', () => {
    mockState.__hyperionMockGuidValue = 'f12345000';
    resetSessionForTests();
    const first = getSessionId();

    mockState.__hyperionMockGuidValue = 'f12345fff';
    resetSessionForTests();
    const second = getSessionId();

    expect(first).toBe('51u680');
    expect(second).toBe('51u9dr');
    expect(first).toMatch(/^[0-9a-z]{6}$/);
    expect(second).toMatch(/^[0-9a-z]{6}$/);
    expect(second).not.toBe(first);
  });
});
