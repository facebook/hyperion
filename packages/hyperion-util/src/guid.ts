
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export type GUID = string;

export function guid(): GUID {
  return 'f' + (window.crypto.getRandomValues(new Uint32Array(1))[0]).toString(16).replace('.', '');
}
