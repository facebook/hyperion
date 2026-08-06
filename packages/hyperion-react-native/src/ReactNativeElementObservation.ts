/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

// Runtime facades intentionally accept React's variadic, untyped ABI.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JSXRuntimeFunction = (this: unknown, ...args: any[]) => unknown;

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
  reactModule: { createElement?: JSXRuntimeFunction },
  jsxRuntimeModule?: {
    jsx?: JSXRuntimeFunction;
    jsxs?: JSXRuntimeFunction;
  } | null,
  jsxDevRuntimeModule?: { jsxDEV?: JSXRuntimeFunction } | null
): void {
  if (jsxRuntimeModule?.jsx != null) {
    jsxRuntimeModule.jsx = createObservedJSXFunction(jsxRuntimeModule.jsx);
  }
  if (jsxRuntimeModule?.jsxs != null) {
    jsxRuntimeModule.jsxs = createObservedJSXFunction(jsxRuntimeModule.jsxs);
  }
  if (jsxDevRuntimeModule?.jsxDEV != null) {
    jsxDevRuntimeModule.jsxDEV = createObservedJSXFunction(
      jsxDevRuntimeModule.jsxDEV
    );
  }
  if (reactModule.createElement != null) {
    originalCreateElement ??= {
      receiver: reactModule,
      renderer: reactModule.createElement,
    };
    reactModule.createElement = createObservedJSXFunction(
      reactModule.createElement,
      'createElement'
    );
  }
}
