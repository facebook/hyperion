/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export interface ALLoggableEvent<MetadataValue = string> {
  readonly eventTimestamp: number;
  readonly eventIndex: number;
  readonly metadata: Record<string, MetadataValue>;
  readonly relatedEventIndex?: number;
}
