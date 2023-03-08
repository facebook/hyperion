/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

// event index
let _eventIndex = -1;

/**
 * getEventIndex:
 * Increment and return an event index:
 * this prevents duplicate allocation of indices.
 * To keep indices contigous,
 * each time an index is requested,
 * it must be consumed
 */
export function getNextEventIndex(): number {
  _eventIndex++;
  return _eventIndex;
}

/**
 * getLastUsedEventIndex:
 * Returns the event index without incrementing, this is useful for linking to AutoLogging events externally
 */
export function getLastUsedEventIndex(): number {
  return _eventIndex;
}
