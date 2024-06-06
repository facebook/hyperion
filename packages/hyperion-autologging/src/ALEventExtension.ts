/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ALExtensibleEvent } from "./ALType";

export function getEventExtension<T extends { [key: string]: any } = { [key: string]: any }>(eventData: ALExtensibleEvent, namespace: string): T | undefined {
  return eventData.__ext?.[namespace] as T;
}

export function setEventExtension(eventData: ALExtensibleEvent, namespace: string, data: { [key: string]: any }) {
  eventData.__ext ??= {};
  const namespaceData = eventData.__ext[namespace] ??= {};
  Object.assign(namespaceData, data);
}

