/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

// Runtime facades intentionally accept React's variadic, untyped ABI.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JSXRuntimeFunction = (this: unknown, ...args: any[]) => unknown;

export interface ElementInstrumenterDescriptor {
  type: unknown;
  props: Record<string, unknown>;
}

export type ElementInstrumenter = (
  type: unknown,
  props: Record<string, unknown> | null | undefined
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

export interface InstrumentedElementProps {
  originalType: unknown;
  originalProps: unknown;
  originalReceiver: unknown;
  originalArgumentCount: number;
  originalArg2?: unknown;
  originalArg3?: unknown;
  originalArg4?: unknown;
  originalArg5?: unknown;
  originalTrailingArgs?: unknown[];
  renderOriginal: OriginalElementRenderer;
}

export type JSXRuntimeKind = 'jsx' | 'createElement';

let elementObservationEnabled = false;
let elementInstrumenter: ElementInstrumenter | null = null;
let benchmarkPair: Readonly<{
  original: JSXRuntimeFunction;
  wrapped: JSXRuntimeFunction;
}> | null = null;

const wrappedFunctions = new WeakMap<
  JSXRuntimeFunction,
  Map<JSXRuntimeKind, JSXRuntimeFunction>
>();

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
  original: JSXRuntimeFunction,
  renderOriginal: OriginalElementRenderer,
  receiver: unknown,
  args: IArguments,
  runtimeKind: JSXRuntimeKind,
  descriptor: ElementInstrumenterDescriptor
): unknown {
  const wrapperProps: Record<string, unknown> & InstrumentedElementProps = {
    ...descriptor.props,
    originalType: args[0],
    originalProps: args[1],
    originalReceiver: receiver,
    originalArgumentCount: args.length,
    renderOriginal,
  };
  if (args.length > 2) wrapperProps.originalArg2 = args[2];
  if (args.length > 3) wrapperProps.originalArg3 = args[3];
  if (args.length > 4) wrapperProps.originalArg4 = args[4];
  if (args.length > 5) wrapperProps.originalArg5 = args[5];
  if (args.length > 6) {
    wrapperProps.originalTrailingArgs = Array.prototype.slice.call(args, 2);
  }

  if (runtimeKind === 'createElement') {
    const key = (args[1] as { key?: unknown } | null | undefined)?.key;
    if (key !== undefined) wrapperProps.key = key;
    return original.call(receiver, descriptor.type, wrapperProps);
  }

  switch (args.length) {
    case 2:
      return original.call(receiver, descriptor.type, wrapperProps);
    case 3:
      return original.call(receiver, descriptor.type, wrapperProps, args[2]);
    case 4:
      return original.call(
        receiver,
        descriptor.type,
        wrapperProps,
        args[2],
        args[3]
      );
    case 5:
      return original.call(
        receiver,
        descriptor.type,
        wrapperProps,
        args[2],
        args[3],
        args[4]
      );
    case 6:
      return original.call(
        receiver,
        descriptor.type,
        wrapperProps,
        args[2],
        args[3],
        args[4],
        args[5]
      );
    default:
      return original.apply(receiver, [
        descriptor.type,
        wrapperProps,
        ...Array.prototype.slice.call(args, 2),
      ]);
  }
}

export function createObservedJSXFunction<T extends JSXRuntimeFunction>(
  original: T,
  runtimeKind: JSXRuntimeKind = 'jsx'
): T {
  let byKind = wrappedFunctions.get(original);
  const installed = byKind?.get(runtimeKind);
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
          props as Record<string, unknown> | null | undefined
        );
        if (descriptor !== null) {
          return createInstrumentedElement(
            original,
            renderOriginal,
            this,
            // eslint-disable-next-line prefer-rest-params
            arguments,
            runtimeKind,
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

  byKind ??= new Map();
  byKind.set(runtimeKind, wrapped);
  wrappedFunctions.set(original, byKind);
  wrappedFunctions.set(wrapped, byKind);
  benchmarkPair = { original, wrapped };
  return wrapped;
}

export function getJSXRuntimeBenchmarkPair(): Readonly<{
  original: JSXRuntimeFunction;
  wrapped: JSXRuntimeFunction;
}> | null {
  return benchmarkPair;
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
    reactModule.createElement = createObservedJSXFunction(
      reactModule.createElement,
      'createElement'
    );
  }
}
