/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { SessionPersistentData } from "@hyperion/hyperion-util/src/PersistentData";

const _eventIndex = new SessionPersistentData<number>(
  "alcei",
  () => -1,
  v => '' + v,
  v => parseInt(v) || -1
);

/**
 * getEventIndex:
 * Increment and return an event index:
 * this prevents duplicate allocation of indices.
 * To keep indices contigous,
 * each time an index is requested,
 * it must be consumed
 */
export function getNextEventIndex(): number {
  return _eventIndex.setValue(_eventIndex.getValue() + 1);
}

/**
 * getLastUsedEventIndex:
 * Returns the event index without incrementing, this is useful for linking to AutoLogging events externally
 */
export function getLastUsedEventIndex(): number {
  return _eventIndex.getValue();
}
