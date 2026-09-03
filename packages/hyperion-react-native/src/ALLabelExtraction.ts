/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type {
  RNElementTextSource,
  RNElementTextSourceType,
  RNEventValueSource,
  RNEventValueSourceType,
} from './ALTypes';

export interface RNElementInfo {
  componentName?: string;
  componentType?: string;
  accessibilityLabel?: string;
  testID?: string;
  ariaLabel?: string;
  title?: string;
  accessibilityRole?: string;
  accessibilityHint?: string;
  placeholder?: string;
  value?: unknown;
  isDisabled?: true;
}

export interface RNElementText {
  text: string;
  source: RNElementTextSource;
  sourceType: RNElementTextSourceType;
  potentiallySensitive: boolean;
}

export interface RNEventValue {
  value: unknown;
  source: RNEventValueSource;
  sourceType: RNEventValueSourceType;
  potentiallySensitive: boolean;
}

const TEXT_INPUT_ROLES = new Set(['search', 'text', 'none']);
const TEXT_INPUT_COMPONENTS = new Set([
  'TextInput',
  'RCTSinglelineTextInputView',
  'RCTMultilineTextInputView',
  'SearchBar',
]);

export function isTextInput(info: RNElementInfo): boolean {
  return (
    (info.accessibilityRole != null &&
      TEXT_INPUT_ROLES.has(info.accessibilityRole)) ||
    (info.componentName != null &&
      TEXT_INPUT_COMPONENTS.has(info.componentName))
  );
}

export function extractLabel(info: RNElementInfo): string | undefined {
  return extractElementText(info)?.text;
}

export function extractElementText(
  info: RNElementInfo
): RNElementText | undefined {
  return (
    createElementText(
      info.accessibilityLabel,
      'accessibilityLabel',
      'application_text'
    ) ??
    createElementText(info.ariaLabel, 'aria-label', 'application_text') ??
    createElementText(info.title, 'title', 'application_text') ??
    createElementText(info.testID, 'testID', 'developer_identifier') ??
    createElementText(info.placeholder, 'placeholder', 'application_text')
  );
}

function createElementText(
  text: string | undefined,
  source: RNElementTextSource,
  sourceType: RNElementTextSourceType
): RNElementText | undefined {
  return text == null || text.length === 0
    ? undefined
    : {
        text,
        source,
        sourceType,
        potentiallySensitive: sourceType !== 'developer_identifier',
      };
}

export function extractEventValue(
  propName: string,
  args: readonly unknown[],
  info: RNElementInfo
): RNEventValue | undefined {
  if (propName === 'onChangeText') {
    return createEventValue(args[0], 'callback_argument', 'user_input');
  }
  if (propName === 'onValueChange') {
    return createEventValue(args[0], 'callback_argument', 'control_value');
  }
  if (
    propName === 'onChange' ||
    propName === 'onSubmitEditing' ||
    propName === 'onEndEditing'
  ) {
    const event = args[0];
    if (event != null && typeof event === 'object') {
      const nativeEvent = (event as { nativeEvent?: unknown }).nativeEvent;
      if (nativeEvent != null && typeof nativeEvent === 'object') {
        const value = (nativeEvent as { text?: unknown }).text;
        const extracted = createEventValue(
          value,
          'native_event_text',
          'user_input'
        );
        if (extracted != null) return extracted;
      }
    }
  }
  if (isTextInput(info)) {
    return createEventValue(info.value, 'element_value_prop', 'user_input');
  }
  return undefined;
}

function createEventValue(
  value: unknown,
  source: RNEventValueSource,
  sourceType: RNEventValueSourceType
): RNEventValue | undefined {
  if (
    value !== null &&
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    return undefined;
  }
  return {
    value,
    source,
    sourceType,
    potentiallySensitive: true,
  };
}

function getStringProp(
  props: Readonly<Record<string, unknown>>,
  name: string
): string | undefined {
  const value = props[name];
  return typeof value === 'string' ? value : undefined;
}

export function extractElementInfo(
  componentName: string | undefined,
  props: Readonly<Record<string, unknown>>
): RNElementInfo {
  const accessibilityState = props.accessibilityState;
  const accessibilityDisabled =
    accessibilityState != null &&
    typeof accessibilityState === 'object' &&
    (accessibilityState as { disabled?: unknown }).disabled === true;
  const accessibilityRole = getStringProp(props, 'accessibilityRole');
  return {
    componentName,
    componentType: accessibilityRole,
    accessibilityLabel: getStringProp(props, 'accessibilityLabel'),
    testID: getStringProp(props, 'testID'),
    ariaLabel: getStringProp(props, 'aria-label'),
    title: getStringProp(props, 'title'),
    accessibilityRole,
    accessibilityHint: getStringProp(props, 'accessibilityHint'),
    placeholder: getStringProp(props, 'placeholder'),
    value: props.value,
    isDisabled:
      props.disabled === true || accessibilityDisabled ? true : undefined,
  };
}

export function isLoggingSuppressed(
  props: Readonly<Record<string, unknown>>
): boolean {
  return (
    props['data-disable-logging'] === true ||
    props.accessibilityElementsHidden === true
  );
}
