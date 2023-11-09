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


// (() => {
//   const storage = getStorage();
//   let id = storage?.getItem(CLIENT_SESSION_ID_FIELD);
//   if (!id) {
//     id = guid();
//     storage?.setItem(CLIENT_SESSION_ID_FIELD, id);
//   }
//   return id;
// })();