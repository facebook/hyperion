
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export type ALID = string;

const AUTO_LOGGING_ID = 'data-auto-logging-id';

function getAutoLoggingID(element?: Element): ALID | null {
  return element ? element.getAttribute(AUTO_LOGGING_ID) : null;
}

export function setAutoLoggingID(element: Element): ALID {
  const autoLoggingID = guid();
  element.setAttribute(AUTO_LOGGING_ID, autoLoggingID);
  return autoLoggingID;
}

export function getOrSetAutoLoggingID(element: Element): ALID {
  return getAutoLoggingID(element) ?? setAutoLoggingID(element);
}
function guid(): ALID {
  return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
}

