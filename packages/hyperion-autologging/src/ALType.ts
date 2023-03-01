/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ALFlowlet } from './ALFlowletManager';

export type ALFlowletEvent = Readonly<{
  flowlet: ALFlowlet;
}>;

export type ALLoggableEvent = Readonly<{
  eventIndex: number,
  eventTimestamp: number,
}>;

