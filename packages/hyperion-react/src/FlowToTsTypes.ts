/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export interface Class<T, A extends any[] = any[]> extends Function { new(...args: A): T; }
export type mixed = any;//unknown;
export type $Values<T> = T[keyof T];