/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ALExtensibleEvent, ALExtensibleEventData } from "./ALType";

export function getEventExtension<T extends ALExtensibleEventData = ALExtensibleEventData>(eventData: ALExtensibleEvent, namespace: string): T | undefined {
  return eventData.__ext?.[namespace] as T;
}

export function setEventExtension(eventData: ALExtensibleEvent, namespace: string, data: ALExtensibleEventData) {
  eventData.__ext ??= {};
  const namespaceData = eventData.__ext[namespace] ??= {};
  Object.assign(namespaceData, data);
}

