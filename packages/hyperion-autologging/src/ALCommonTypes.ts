/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export interface ALLoggableEvent {
  readonly eventTimestamp: number;
  readonly eventIndex: number;
  readonly metadata: Record<string, string>;
  readonly relatedEventIndex?: number;
}
