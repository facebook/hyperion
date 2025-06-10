/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */
'use strict';

describe("Hyperion Autologging Plugin FPS", () => {
  let rafSpy: jest.SpyInstance;

  beforeEach(() => {
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(performance.now()); return 0;
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
  });

  test("empty test", () => {
    window.requestAnimationFrame(() => {
    });
    expect(0);
  });
});