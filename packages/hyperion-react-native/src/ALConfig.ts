/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export interface ALFeatureConfig {
  automaticUIEvents?: boolean;
  surfaceMutationEvents?: boolean;
  customEvents?: boolean;
  screenTransitionEvents?: boolean;
  listImpressionEvents?: boolean;
  deepLinkEvents?: boolean;
  reactErrorEvents?: boolean;
}

export type ALFeature = keyof ALFeatureConfig;

export interface ALConfig {
  appName: string;
  enabled?: boolean;
  heartbeatInterval?: number | false;
  maxUserInactivityDuration?: number;
  debug?: boolean;
  interceptProps?: readonly string[];
  componentNameValidator?: (name: string) => boolean;
  features?: ALFeatureConfig;
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

const EVENT_TYPES: Readonly<Record<string, string>> = Object.freeze({
  onPress: 'click',
  onPressIn: 'press_in',
  onLongPress: 'long_press',
  onChangeText: 'change',
  onChange: 'change',
  onValueChange: 'change',
  onScroll: 'scroll',
  onFocus: 'focusin',
  onSubmitEditing: 'submit',
  onBlur: 'focusout',
  onRefresh: 'refresh',
});

export function mapPropToEventType(prop: string): string {
  return EVENT_TYPES[prop] ?? prop;
}
