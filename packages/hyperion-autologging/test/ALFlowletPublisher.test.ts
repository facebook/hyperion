/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */
'use strict';

import { Channel } from "@hyperion/hyperion-hook/src/Channel";
import { ALFlowletManager } from "../src/ALFlowletManager";
import * as ALFlowletPublisher from "../src/ALFlowletPublisher";
import { getFullNamePattern } from "@hyperion/hyperion-flowlet/test/FlowletTestUtil";

describe('ALFlowletPublisher', () => {

  it('Track flowlet events firing', () => {
    const flowletManager = new ALFlowletManager();
    const channel = new Channel<ALFlowletPublisher.ALChannelFlowletEvent>();
    ALFlowletPublisher.publish({ channel });
    const fn = jest.fn();

    channel.addListener('al_flowlet_event', fn);

    const f1 = new flowletManager.flowletCtor("f1");
    const f2 = f1.fork("f2");
    const f3 = flowletManager.push(f2, "f3");

    expect(fn).toBeCalledTimes(3);
    expect(fn.mock.calls[0][0].flowlet.getFullName()).toMatch(getFullNamePattern("/f1"));
    expect(fn.mock.calls[1][0].flowlet.getFullName()).toMatch(getFullNamePattern("/f1/f2"));
    expect(fn.mock.calls[2][0].flowlet.getFullName()).toMatch(getFullNamePattern("/f1/f2/f3"));
  });
});
