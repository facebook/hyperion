/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export const DEFAULT_INTERCEPT_PROPS: readonly string[] = Object.freeze([
  'onPress',
  'onLongPress',
  'onChangeText',
  'onSubmitEditing',
  'onFocus',
  'onBlur',
  'onRefresh',
]);

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
