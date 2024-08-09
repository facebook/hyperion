/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { SessionPersistentData } from "./PersistentData";
import { guid } from "./guid";

export const ClientSessionID: string = new SessionPersistentData<string>(
  "alcsid",
  guid,
  v => v,
  v => v,
).getValue();
