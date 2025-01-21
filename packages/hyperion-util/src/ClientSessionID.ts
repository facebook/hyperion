/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "hyperion-globals";
import { CookiePersistentData, SessionPersistentData } from "./PersistentData";
import { guid } from "./guid";

export const ClientSessionID: string = new SessionPersistentData<string>(
  "alcsid",
  guid,
  v => v,
  v => v,
  true, //In case page is immediately reloaded, we don't want to wait for the scheduler to save
).getValue();


let domainSessionId: CookiePersistentData<string> | null = null;
export function getDomainSessionID(topLevelDomain?: string, cookieName?: string): string {

  if (!domainSessionId) {
    const currentHostname = window.location.hostname;
    if (topLevelDomain) {
      assert(currentHostname.endsWith(topLevelDomain), "invalid top level domain for this page");
    } else {
      topLevelDomain = currentHostname;
    }

    domainSessionId = new CookiePersistentData<string>(
      cookieName ?? 'aldsid',
      guid,
      v => v,
      v => v,
      `;domain=${topLevelDomain}; path=/`
    );
  }
  return domainSessionId.getValue();
}
