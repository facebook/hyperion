/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

type Combine<T extends [...any[]]> = T extends [infer U, ... infer V] ? U & Combine<V> : {};
type CombineReadonly<T extends [...any[]]> = T extends [infer U, ... infer V] ? Readonly<U> & Combine<V> : {};

type Beautify<T> = { [K in keyof T]: T[K] } & {}
export type Options<Options extends [...any[]] | {}> = Beautify<
  Options extends [...any[]]
  ? CombineReadonly<Options>
  : Options
>;