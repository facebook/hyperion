/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
import { IWindowPrototype } from "@hyperion/hyperion-dom/src/IWindow";


describe('performanceAbsoluteNow', () => {
  test("place holder test", () => {
    expect(0);
  });
  //   beforeEach(() => {
  //     const IPerformance = interceptMethod("performance", IWindowPrototype);

  //     jest.resetAllMocks();
  //     jest.resetModules();
  //   });

  //   describe('with supporting env', () => {
  //     it('Computes the right value', () => {
  //       const mockNow = 100;
  //       const mockNavStart = 1000;

  //       jest.mock('performance', () => {
  //         return {
  //           now: () => mockNow,
  //           timing: {
  //             navigationStart: mockNavStart,
  //           },
  //         };
  //       });

  //       const performanceAbsoluteNow = require('performanceAbsoluteNow');
  //       expect(performanceAbsoluteNow()).toBe(mockNavStart + mockNow);
  //     });

  //     it('Ignores custom fallback', () => {
  //       const mockNow = 100;
  //       const mockNavStart = 1000;
  //       const mockDateNow = 500;

  //       jest.mock('performance', () => {
  //         return {
  //           now: () => mockNow,
  //           timing: {
  //             navigationStart: mockNavStart,
  //           },
  //         };
  //       });

  //       const performanceAbsoluteNow = require('performanceAbsoluteNow');
  //       performanceAbsoluteNow.setFallback(() => mockDateNow);

  //       expect(performanceAbsoluteNow()).toBe(mockNavStart + mockNow);
  //     });
  //   });

  //   describe('without supporting env', () => {
  //     it('Falls back to Date.now by default', () => {
  //       const mockDateNow = 1000;

  //       jest.mock('performance', () => {
  //         return {
  //           now: null,
  //         };
  //       });

  //       jest.spyOn(global.Date, 'now').mockImplementation(() => mockDateNow);
  //       const performanceAbsoluteNow = require('performanceAbsoluteNow');
  //       expect(performanceAbsoluteNow()).toBe(mockDateNow);
  //     });
  //     it('Supports a custom fallback', () => {
  //       const mockPerformanceAbsoluteNow = 42;
  //       jest.mock('performance', () => {
  //         return {
  //           now: null,
  //         };
  //       });

  //       const performanceAbsoluteNow = require('performanceAbsoluteNow');
  //       performanceAbsoluteNow.setFallback(() => mockPerformanceAbsoluteNow);

  //       expect(performanceAbsoluteNow()).toBe(mockPerformanceAbsoluteNow);
  //     });
  //   });
});
