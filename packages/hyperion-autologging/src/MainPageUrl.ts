/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as IHistory from "hyperion-dom/src/IHistory";
import { assert, getLogger } from "hyperion-globals";
import { Hook } from "hyperion-hook";

let mainPageUrl: URL = new URL('http://undefined');

export function getCurrMainPageUrl(): URL {
  __DEV__ && assert(
    mainPageUrl.href === window.location.href,
    `The main page url is not matching the page url`
  );

  return mainPageUrl;
}
export const onMainPageUrlChange: Hook<(url: URL) => void> = new Hook();

export function updateMainPageUrl(url: string, ignoreIfSame = false) {
  try {
    /**
     * We need to ensure the url is absolute, but to avoid
     * creating the URL object multiple times and throw it
     * away, we first check the url in case given url is
     * already in absolute form.
     */
    if (mainPageUrl.href !== url) {
      const newUrl = new URL(
        url,
        mainPageUrl.href, // to handle relative urls
      );

      // We try to keep the old obj if the result is still the same
      if (mainPageUrl.href !== newUrl.href) {
        mainPageUrl = newUrl;
        onMainPageUrlChange.call(mainPageUrl);
        return;
      }
    }
    if (!ignoreIfSame) {
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
  const updateToLocation = () => updateMainPageUrl(window.location.href, true);
  window.addEventListener('hashchange', updateToLocation);
  window.addEventListener('popstate', updateToLocation);
  if (typeof window.navigation === 'object') {
    window.navigation.addEventListener("navigate", (_event: Event & { destination?: { url: string } }) => {
      /**
       * the navigation event seems to fire multiple times and not always it matches window.location.href
       * Also, the event fires before actual navigation to a new page, and we may incorrectly use the target
       * page url for the events that happen at the end of the page lifecycle.
       * So, instead of using the event.destination.url, we use the current window location.
       */
      updateMainPageUrl(window.location.href, true);
    });
  }
  IHistory.replaceState.onAfterCallMapperAdd(updateToLocation);
  IHistory.pushState.onAfterCallMapperAdd(updateToLocation);
}
