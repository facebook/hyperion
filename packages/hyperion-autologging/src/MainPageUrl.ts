/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { getLogger } from "@hyperion/hyperion-global";
import { Hook } from "@hyperion/hyperion-hook";

let mainPageUrl: URL = new URL('http://undefined');

export function getCurrMainPageUrl(): URL {
  return mainPageUrl;
}
export const onMainPageUrlChange: Hook<(url: URL) => void> = new Hook();

export function updateMainPageUrl(url: string) {
  try {
    // We need to ensure the url is absolute
    const newUrl = new URL(
      url,
      mainPageUrl.href, // to handle missing cases
    );

    if (mainPageUrl.href !== newUrl.href) {
      mainPageUrl = newUrl;
      onMainPageUrlChange.call(mainPageUrl);
    } else {
      getLogger().warn?.(`ignoring url: path didn't change in ${url}`);
    }
  } catch (e) {
    getLogger().error('invalid url');
  }
}

declare var window: Window & {
  navigation?: EventTarget, // Only newer browsers support this https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate_event
};

// Lets make sure we are running on the main thread in the browser
if (
  typeof window === 'object' &&
  typeof window.location === 'object' &&
  typeof window.location.href === 'string'
) {
  // We are on the main thread and so safe to update automatically
  // eslint-disable-next-line no-restricted-properties
  updateMainPageUrl(window.location.href);

  // Now we should detect any change
  window.addEventListener('hashchange', () => updateMainPageUrl(window.location.href));
  window.addEventListener('popstate', () => updateMainPageUrl(window.location.href));
  if (typeof window.navigation === 'object') {
    window.navigation.addEventListener("navigate", (event: Event & { destination?: { url: string } }) => {
      if (event.destination?.url) {
        updateMainPageUrl(event.destination.url);
      }
    });
  }
  //TODO: a more accurate approach is to intercept window.history.{pushState | replaceState} to catch changes immediately.
}
