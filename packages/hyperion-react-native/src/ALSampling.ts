/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export function normalizeSampleRate(value: unknown): number {
  if (value == null) return 1;
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function shouldSampleSession(
  sampleRate: number,
  randomValue = Math.random(),
): boolean {
  if (sampleRate <= 0) return false;
  if (sampleRate >= 1) return true;
  return randomValue < sampleRate;
}
