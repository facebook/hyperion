/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel } from 'hyperion-channel/src/Channel';
import type { ALChannelEventMap } from '../src/ALTypes';

export function createALTestChannel(): Channel<ALChannelEventMap> {
  return new Channel<ALChannelEventMap>();
}
