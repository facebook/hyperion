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
export function getEventIndex(): number {
  _eventIndex++;
  return _eventIndex;
}

/**
 * getLastUsedEventIndex:
 * Returns the event index without incrementing, this is for passing the AL event index into PEEv2 logging in AdsInterfacesLogger.js
 */
export function getLastUsedEventIndex(): number {
  return _eventIndex;
}
