/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "./reference";

let _globalFlags: GlobalFlags = {};

export function getFlags(): GlobalFlags {
  return _globalFlags;
}

export function setFlags(flags: GlobalFlags): void {
  _globalFlags = flags;
}