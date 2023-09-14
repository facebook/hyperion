/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IEvent from "../src/IEvent";
import * as intercept from "@hyperion/hyperion-core/src/intercept";

describe('test Event interception', () => {
  test('test base Event', () => {
    const stopPropagation = jest.fn();
    IEvent.stopPropagation.onArgsObserverAdd(stopPropagation);

    const eventIntercepted = jest.fn();
    IEvent.IEventPrototype.onBeforInterceptObj.add(eventIntercepted);

    const event = new Event('test');
    expect(intercept.isIntercepted(event)).toBe(false);
    expect(eventIntercepted).toBeCalledTimes(0);
    intercept.intercept(event);
    expect(intercept.isIntercepted(event)).toBe(true);
    expect(eventIntercepted).toBeCalledTimes(1);

    event.stopPropagation();
    expect(stopPropagation).toBeCalledTimes(1);

  });
});