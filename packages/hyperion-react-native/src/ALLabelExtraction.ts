/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { RNElementTextSource } from './ALTypes';

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
  isDisabled?: true;
}

export interface RNElementText {
  text: string;
  source: RNElementTextSource;
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
  const candidates: readonly [RNElementTextSource, string | undefined][] = [
    ['accessibilityLabel', info.accessibilityLabel],
    ['aria-label', info.ariaLabel],
    ['title', info.title],
    ['testID', info.testID],
    ['placeholder', !isTextInput(info) ? info.placeholder : undefined],
  ];
  for (const [source, text] of candidates) {
    if (text != null && text.length > 0) return { text, source };
  }
  return undefined;
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
  return {
    componentName,
    componentType:
      typeof props.accessibilityRole === 'string'
        ? props.accessibilityRole
        : undefined,
    accessibilityLabel:
      typeof props.accessibilityLabel === 'string'
        ? props.accessibilityLabel
        : undefined,
    testID: typeof props.testID === 'string' ? props.testID : undefined,
    ariaLabel:
      typeof props['aria-label'] === 'string' ? props['aria-label'] : undefined,
    title: typeof props.title === 'string' ? props.title : undefined,
    accessibilityRole:
      typeof props.accessibilityRole === 'string'
        ? props.accessibilityRole
        : undefined,
    accessibilityHint:
      typeof props.accessibilityHint === 'string'
        ? props.accessibilityHint
        : undefined,
    placeholder:
      typeof props.placeholder === 'string' ? props.placeholder : undefined,
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
