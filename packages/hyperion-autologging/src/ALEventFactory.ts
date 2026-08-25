/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type {
  ALLoggableEvent,
  ALMetadata,
  ALMetadataValue,
} from './ALCommonTypes';

export interface ALEventEnvironment<MetadataValue = ALMetadataValue> {
  now(): number;
  nextEventIndex(): number;
  getBaseMetadata(): Readonly<ALMetadata<MetadataValue>>;
}

export interface ALCreateEventOptions<MetadataValue = ALMetadataValue> {
  readonly eventTimestamp?: number;
  readonly metadata?: Readonly<ALMetadata<MetadataValue>>;
  readonly relatedEventIndex?: number;
}

export interface ALEventFactory<MetadataValue = ALMetadataValue> {
  createEvent(
    options?: ALCreateEventOptions<MetadataValue>
  ): ALLoggableEvent<MetadataValue>;
}

export function createALEventFactory<MetadataValue = ALMetadataValue>(
  environment: ALEventEnvironment<MetadataValue>
): ALEventFactory<MetadataValue> {
  return {
    createEvent(options) {
      const eventTimestamp = options?.eventTimestamp ?? environment.now();
      const relatedEventIndex = options?.relatedEventIndex;
      const metadata: ALMetadata<MetadataValue> = {
        ...environment.getBaseMetadata(),
        ...options?.metadata,
      };
      const event: {
        eventTimestamp: number;
        eventIndex: number;
        metadata: ALMetadata<MetadataValue>;
        relatedEventIndex?: number;
      } = {
        eventTimestamp,
        eventIndex: environment.nextEventIndex(),
        metadata,
      };
      if (relatedEventIndex !== undefined) {
        event.relatedEventIndex = relatedEventIndex;
      }
      return event;
    },
  };
}
