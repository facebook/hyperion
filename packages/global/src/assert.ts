/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "./global";

interface Options {
  getCallStack?: (skipFrameCount: number, exception?: any) => string[];
  logger: {
    error(message?: any, ...optionalParams: any[]): void;
  };
}

const devOptions: Required<Options> = {
  getCallStack: () => [],
  logger: console,
}

export function setAssertLoggerOptions(options: Options): void {
  devOptions.getCallStack = options.getCallStack ?? devOptions.getCallStack;
  devOptions.logger = options.logger;
}

export function assert(condition: boolean | undefined, message: string, options?: Options): asserts condition {
  if (!condition) {
    const callStackGetter = options?.getCallStack ?? devOptions.getCallStack;
    const logger = options?.logger ?? devOptions.logger;
    const callStack = callStackGetter(2);

    if (callStack && callStack.length > 0) {
      logger.error(message, callStack);
    } else {
      logger.error(message);
    }
  }
}