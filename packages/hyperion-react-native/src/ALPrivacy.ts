/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type {
  ALCustomEventAttributes,
  SurfaceMetadata,
  SurfaceMetadataValue,
} from './ALTypes';

export const MAX_LABEL_LENGTH = 128;
export const MAX_METADATA_ENTRIES = 20;
export const MAX_METADATA_KEY_LENGTH = 64;
export const MAX_METADATA_VALUE_LENGTH = 256;
export const MAX_TARGET_URI_LENGTH = 256;
export const MAX_COMPONENT_STACK_DEPTH = 16;

const SAFE_METADATA_KEY_RE = /^[a-zA-Z][a-zA-Z0-9_.-]*$/;
const UNSAFE_METADATA_KEY_RE =
  /(auth|authorization|cookie|credential|email|password|phone|secret|token|uri|url)/i;
const STABLE_TARGET_URI_RE =
  /^[a-z][a-z0-9+.-]*:\/\/[a-zA-Z0-9][a-zA-Z0-9._~-]*(?:\/[a-zA-Z0-9._~/-]*)?$/;
const STABLE_IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_.$:-]*$/;
const REACT_COMPONENT_STACK_LINE_RE =
  /^(?:at|in)\s+([a-zA-Z_$][a-zA-Z0-9_.$:-]*)/;

function isSafeMetadataKey(key: string): boolean {
  return (
    key.length <= MAX_METADATA_KEY_LENGTH &&
    SAFE_METADATA_KEY_RE.test(key) &&
    !UNSAFE_METADATA_KEY_RE.test(key)
  );
}

export function sanitizeLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed.slice(0, MAX_LABEL_LENGTH);
}

export function sanitizeStableIdentifier(value: unknown): string | undefined {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_LABEL_LENGTH ||
    !STABLE_IDENTIFIER_RE.test(value)
  ) {
    return undefined;
  }
  return value;
}

export function sanitizeStableTargetURI(value: unknown): string | undefined {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_TARGET_URI_LENGTH ||
    !STABLE_TARGET_URI_RE.test(value)
  ) {
    return undefined;
  }
  return value;
}

export function sanitizeErrorName(value: unknown): string {
  switch (value) {
    case 'AggregateError':
    case 'Error':
    case 'EvalError':
    case 'RangeError':
    case 'ReferenceError':
    case 'SyntaxError':
    case 'TypeError':
    case 'URIError':
      return value;
    default:
      return 'Error';
  }
}

export function sanitizeReactComponentStack(value: unknown): readonly string[] {
  if (typeof value !== 'string') return [];
  const result: string[] = [];
  for (const line of value.split('\n')) {
    if (result.length >= MAX_COMPONENT_STACK_DEPTH) break;
    const name = sanitizeStableIdentifier(
      REACT_COMPONENT_STACK_LINE_RE.exec(line.trim())?.[1]
    );
    if (name != null) result.push(name);
  }
  return result;
}

export function mergeMetadata(
  ...sources: readonly (
    | Readonly<Record<string, unknown>>
    | null
    | undefined
  )[]
): Record<string, SurfaceMetadataValue> {
  const entries: [string, SurfaceMetadataValue][] = [];
  for (const source of sources) {
    if (source == null) continue;
    for (const [key, value] of Object.entries(source)) {
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value))
      ) {
        entries.push([key, value]);
      }
    }
  }
  return Object.fromEntries(entries);
}

export function getExplicitText(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function sanitizeMetadata(
  ...sources: readonly (Readonly<Record<string, unknown>> | null | undefined)[]
): Record<string, string> {
  const result: Record<string, string> = {};
  let count = 0;
  for (const source of sources) {
    if (source == null) continue;
    for (const [key, value] of Object.entries(source)) {
      if (!isSafeMetadataKey(key) || value == null) continue;
      const exists = Object.prototype.hasOwnProperty.call(result, key);
      if (!exists && count >= MAX_METADATA_ENTRIES) continue;
      if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) {
        continue;
      }
      if (typeof value === 'number' && !Number.isFinite(value)) continue;
      result[key] = String(value).slice(0, MAX_METADATA_VALUE_LENGTH);
      if (!exists) count++;
    }
  }
  return result;
}

export function sanitizeSurfaceMetadata(
  ...sources: readonly (SurfaceMetadata | null | undefined)[]
): SurfaceMetadata {
  return sanitizeMetadata(...sources);
}

export function sanitizeCustomAttributes(
  source: Readonly<Record<string, unknown>> | null | undefined
): ALCustomEventAttributes {
  const result: Record<string, string | number | boolean> = {};
  if (source == null) return result;
  let count = 0;
  for (const [key, value] of Object.entries(source)) {
    if (count >= MAX_METADATA_ENTRIES || !isSafeMetadataKey(key)) continue;
    if (typeof value === 'string') {
      result[key] = value.slice(0, MAX_METADATA_VALUE_LENGTH);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = value;
    } else if (typeof value === 'boolean') {
      result[key] = value;
    } else {
      continue;
    }
    count++;
  }
  return result;
}

export function getSafeControlValue(
  propName: string,
  rawValue: unknown,
  elementName?: string,
  allowlist?: Readonly<Record<string, readonly string[]>>
): string | undefined {
  if (propName !== 'onValueChange') return undefined;
  if (typeof rawValue === 'boolean') return String(rawValue);
  if (elementName == null) return undefined;
  const serialized =
    typeof rawValue === 'string' ||
    (typeof rawValue === 'number' && Number.isFinite(rawValue))
      ? String(rawValue)
      : undefined;
  return serialized != null && allowlist?.[elementName]?.includes(serialized)
    ? serialized.slice(0, MAX_METADATA_VALUE_LENGTH)
    : undefined;
}
