
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export type GUID = string;

export function guid(): GUID {
  return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
}
