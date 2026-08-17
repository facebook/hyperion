/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

// Runtime facades intentionally accept React's variadic, untyped ABI.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JSXRuntimeFunction = (this: unknown, ...args: any[]) => unknown;

export interface ReactModuleExports {
  Component?: new (...args: never[]) => unknown;
  createElement?: JSXRuntimeFunction;
}

export interface JSXRuntimeModuleExports {
  jsx?: JSXRuntimeFunction;
  jsxs?: JSXRuntimeFunction;
}

export interface JSXDevRuntimeModuleExports {
  jsxDEV?: JSXRuntimeFunction;
}

export interface ElementInstrumenterDescriptor {
  type: unknown;
}

export type ElementInstrumenter = (
  type: unknown,
  props: Record<string, unknown> | null | undefined,
  key?: unknown
) => ElementInstrumenterDescriptor | null;

export type OriginalElementRenderer = (
  receiver: unknown,
  type: unknown,
  props: unknown,
  argumentCount: number,
  arg2?: unknown,
  arg3?: unknown,
  arg4?: unknown,
  arg5?: unknown,
  trailingArgs?: unknown[]
) => unknown;

export type JSXRuntimeKind = 'jsx' | 'createElement';

let elementObservationEnabled = false;
let elementInstrumenter: ElementInstrumenter | null = null;
let originalCreateElement: Readonly<{
  receiver: unknown;
  renderer: JSXRuntimeFunction;
}> | null = null;
let benchmarkPair: Readonly<{
  original: JSXRuntimeFunction;
  wrapped: JSXRuntimeFunction;
}> | null = null;

const wrappedFunctions: Record<
  JSXRuntimeKind,
  WeakMap<JSXRuntimeFunction, JSXRuntimeFunction>
> = {
  jsx: new WeakMap(),
  createElement: new WeakMap(),
};

export function setElementObservationEnabled(enabled: boolean): void {
  elementObservationEnabled = enabled;
}

export function isElementObservationEnabled(): boolean {
  return elementObservationEnabled;
}

export function setElementInstrumenter(
  instrumenter: ElementInstrumenter | null
): void {
  elementInstrumenter = instrumenter;
}

export function isElementInstrumenterInstalled(): boolean {
  return elementInstrumenter !== null;
}

function createOriginalRenderer(
  original: JSXRuntimeFunction
): OriginalElementRenderer {
  return function renderOriginal(
    receiver,
    type,
    props,
    argumentCount,
    arg2,
    arg3,
    arg4,
    arg5,
    trailingArgs
  ) {
    switch (argumentCount) {
      case 2:
        return original.call(receiver, type, props);
      case 3:
        return original.call(receiver, type, props, arg2);
      case 4:
        return original.call(receiver, type, props, arg2, arg3);
      case 5:
        return original.call(receiver, type, props, arg2, arg3, arg4);
      case 6:
        return original.call(receiver, type, props, arg2, arg3, arg4, arg5);
      default:
        return original.apply(receiver, [type, props, ...(trailingArgs ?? [])]);
    }
  };
}

function createInstrumentedElement(
  renderOriginal: OriginalElementRenderer,
  receiver: unknown,
  args: IArguments,
  descriptor: ElementInstrumenterDescriptor
): unknown {
  return renderOriginal(
    receiver,
    descriptor.type,
    args[1],
    args.length,
    args[2],
    args[3],
    args[4],
    args[5],
    args.length > 6 ? Array.prototype.slice.call(args, 2) : undefined
  );
}

export function createObservedJSXFunction<T extends JSXRuntimeFunction>(
  original: T,
  runtimeKind: JSXRuntimeKind = 'jsx'
): T {
  const cachedFunctions = wrappedFunctions[runtimeKind];
  const installed = cachedFunctions.get(original);
  if (installed != null) return installed as T;

  const renderOriginal = createOriginalRenderer(original);
  const wrapped = function (this: unknown, type: unknown, props: unknown) {
    if (!elementObservationEnabled) {
      // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
      return original.apply(this, arguments as any);
    }
    try {
      const instrumenter = elementInstrumenter;
      if (instrumenter !== null) {
        const descriptor = instrumenter(
          type,
          props as Record<string, unknown> | null | undefined,
          runtimeKind === 'createElement'
            ? (props as { key?: unknown } | null | undefined)?.key
            : // eslint-disable-next-line prefer-rest-params
              arguments[2]
        );
        if (descriptor !== null) {
          return createInstrumentedElement(
            renderOriginal,
            this,
            // eslint-disable-next-line prefer-rest-params
            arguments,
            descriptor
          );
        }
      }
    } catch {
      // Observation must never change React rendering behavior.
    }
    // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
    return original.apply(this, arguments as any);
  } as T;

  cachedFunctions.set(original, wrapped);
  cachedFunctions.set(wrapped, wrapped);
  benchmarkPair = { original, wrapped };
  return wrapped;
}

export function getJSXRuntimeBenchmarkPair(): Readonly<{
  original: JSXRuntimeFunction;
  wrapped: JSXRuntimeFunction;
}> | null {
  return benchmarkPair;
}

export function getOriginalCreateElement(): Readonly<{
  receiver: unknown;
  renderer: JSXRuntimeFunction;
}> | null {
  return originalCreateElement;
}

export function installReactNativeJSXRuntime(
  reactModule: ReactModuleExports,
  jsxRuntimeModule?: JSXRuntimeModuleExports | null,
  jsxDevRuntimeModule?: JSXDevRuntimeModuleExports | null
): void {
  installObservedRuntimeFunctions(jsxRuntimeModule, ['jsx', 'jsxs'], 'jsx');
  installObservedRuntimeFunctions(jsxDevRuntimeModule, ['jsxDEV'], 'jsx');
  const originalCreateElementFunction = installObservedRuntimeFunction(
    reactModule,
    'createElement',
    'createElement'
  );
  if (originalCreateElementFunction != null) {
    originalCreateElement ??= {
      receiver: reactModule,
      renderer: originalCreateElementFunction,
    };
  }
}

function installObservedRuntimeFunctions(
  runtimeModule: object | null | undefined,
  keys: readonly string[],
  runtimeKind: JSXRuntimeKind
): void {
  if (runtimeModule == null) return;
  for (const key of keys) {
    installObservedRuntimeFunction(runtimeModule, key, runtimeKind);
  }
}

function installObservedRuntimeFunction(
  runtimeModule: object,
  key: string,
  runtimeKind: JSXRuntimeKind
): JSXRuntimeFunction | null {
  const mutableRuntimeModule = runtimeModule as Record<string, unknown>;
  let original: unknown;
  try {
    original = mutableRuntimeModule[key];
  } catch {
    return null;
  }
  if (typeof original !== 'function') return null;
  const originalFunction = original as JSXRuntimeFunction;
  const wrapped = createObservedJSXFunction(originalFunction, runtimeKind);

  try {
    mutableRuntimeModule[key] = wrapped;
    if (mutableRuntimeModule[key] !== wrapped) {
      restoreRuntimeFunction(mutableRuntimeModule, key, originalFunction);
      return null;
    }
  } catch {
    restoreRuntimeFunction(mutableRuntimeModule, key, originalFunction);
    return null;
  }
  return originalFunction;
}

function restoreRuntimeFunction(
  runtimeModule: Record<string, unknown>,
  key: string,
  original: JSXRuntimeFunction
): void {
  try {
    runtimeModule[key] = original;
  } catch {
    // A hostile runtime facade must not make initialization fail.
  }
}
