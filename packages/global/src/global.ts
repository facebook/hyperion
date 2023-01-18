/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "./reference";

type OurGlobal = {
  __DEV__?: boolean;

}

type NodeGlobal = {
  process?: {
    env?: { [index: string]: any }
  }
};

declare var window: Window;
declare var global: Object & OurGlobal & NodeGlobal;

const globalScope =
  typeof globalThis === "object" ? globalThis :
    typeof global === "object" ? global :
      typeof window === "object" ? window :
        typeof self === "object" ? self :
          {};


if (typeof __DEV__ !== "boolean") {
  (globalThis as OurGlobal).__DEV__ = true;

  if (
    typeof global === "object" && (
      global?.process?.env?.JEST_WORKER_ID ||
      global?.process?.env?.NODE_ENV === 'development'
    )
  ) {
    global["__DEV__"] = true;
  }
}


export default globalScope;