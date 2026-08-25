/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export type ALMetadataValue = string | number | boolean | null;

export type ALMetadata<MetadataValue = ALMetadataValue> = Record<
  string,
  MetadataValue
>;

export type ALTimedEvent = Readonly<{
  eventTimestamp: number;
}>;

export type ALMetadataEvent<MetadataValue = ALMetadataValue> = Readonly<{
  metadata: ALMetadata<MetadataValue>;
}>;

export type ALLoggableEvent<MetadataValue = ALMetadataValue> = ALTimedEvent &
  ALMetadataEvent<MetadataValue> &
  Readonly<{
    eventIndex: number;
    relatedEventIndex?: number;
  }>;

export interface ALTransportEnvelope<
  Event extends ALLoggableEvent<unknown>,
  Context
> {
  readonly family: string;
  readonly event: Event;
  readonly context: Context;
}
