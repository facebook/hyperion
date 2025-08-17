/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type ReactDOM from "react-dom";
import type { createRoot } from "react-dom/client";

import { InterceptedModuleExports, interceptModuleExports, ModuleExportsKeys } from 'hyperion-core/src/IRequire';

export type ReactDOMModuleExports = {
  createPortal: typeof ReactDOM.createPortal;
}

export type IReactDOMModuleExports = InterceptedModuleExports<ReactDOMModuleExports>;
let IReactDOMModule: IReactDOMModuleExports | null = null;

export type ReactDOMClientModuleExports = {
  createRoot: typeof createRoot;
}

export type IReactDOMClientModuleExports = InterceptedModuleExports<ReactDOMClientModuleExports>;
let IReactDOMClientModule: IReactDOMClientModuleExports | null = null;


export function interceptDOM(moduleId: string, moduleExports: ReactDOMModuleExports, failedExportsKeys?: ModuleExportsKeys<ReactDOMModuleExports>): IReactDOMModuleExports {
  if (!IReactDOMModule) {
    IReactDOMModule = interceptModuleExports(moduleId, moduleExports, ['createPortal'], failedExportsKeys);
  }
  return IReactDOMModule;
}

export function interceptDOMClient(moduleId: string, moduleExports: ReactDOMClientModuleExports, failedExportsKeys?: ModuleExportsKeys<ReactDOMClientModuleExports>): IReactDOMClientModuleExports {
  if (!IReactDOMClientModule) {
    IReactDOMClientModule = interceptModuleExports(moduleId, moduleExports, ['createRoot'], failedExportsKeys);
  }
  return IReactDOMClientModule;
}
