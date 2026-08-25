/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

/* eslint-disable @typescript-eslint/no-unsafe-function-type, prefer-rest-params */

import { Hook } from './Hook';

export type HookErrorHandler = (error: unknown) => void;

const resilientCallbacks = new WeakMap<Function, Function>();

export class ResilientHook<
  CallbackType extends Function
> extends Hook<CallbackType> {
  constructor(private readonly onError?: HookErrorHandler) {
    super();
  }

  protected createSingleCallbackCall(callback: CallbackType): CallbackType {
    const onError = this.onError;
    const call = function (this: unknown) {
      try {
        return callback.apply(this, arguments);
      } catch (error) {
        reportError(onError, error);
      }
    };
    resilientCallbacks.set(call, callback);
    return call as Function as CallbackType;
  }

  protected createMultiCallbackCall(callbacks: CallbackType[]): CallbackType {
    const onError = this.onError;
    const call = function (this: unknown): void {
      const currentCallbacks = callbacks;
      for (let i = 0, len = currentCallbacks.length; i < len; ++i) {
        try {
          currentCallbacks[i].apply(this, arguments);
        } catch (error) {
          reportError(onError, error);
        }
      }
    };
    return call as Function as CallbackType;
  }

  protected getCallbackForComparison(callback: CallbackType): CallbackType {
    return (resilientCallbacks.get(callback) ?? callback) as CallbackType;
  }
}

function reportError(
  onError: HookErrorHandler | undefined,
  error: unknown
): void {
  try {
    onError?.(error);
  } catch {
    // Error reporting must not interrupt resilient callback dispatch.
  }
}
