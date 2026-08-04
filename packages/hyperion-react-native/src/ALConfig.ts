/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export interface ALConfig {
  appName: string;
  enabled?: boolean;
  heartbeatInterval?: number | false;
  maxUserInactivityDuration?: number;
  debug?: boolean;
  interceptProps?: readonly string[];
  componentNameValidator?: (name: string) => boolean;
}

export const DEFAULT_INTERCEPT_PROPS: readonly string[] = Object.freeze([
  'onPress',
  'onLongPress',
  'onChangeText',
  'onSubmitEditing',
  'onFocus',
  'onBlur',
  'onRefresh',
]);

export const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  heartbeatInterval: 30_000,
  debug:
    (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ === true,
  interceptProps: DEFAULT_INTERCEPT_PROPS,
});

export function mapPropToEventType(prop: string): string {
  switch (prop) {
    case 'onPress':
      return 'click';
    case 'onPressIn':
      return 'press_in';
    case 'onLongPress':
      return 'long_press';
    case 'onChangeText':
    case 'onChange':
    case 'onValueChange':
      return 'change';
    case 'onScroll':
      return 'scroll';
    case 'onFocus':
      return 'focusin';
    case 'onSubmitEditing':
      return 'submit';
    case 'onBlur':
      return 'focusout';
    case 'onRefresh':
      return 'refresh';
    default:
      return prop;
  }
}
