/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type { InterceptedModuleExports, ModuleExportsKeys } from './IRequire';

import { interceptModuleExports } from './IRequire';

import type ReactDOM from "react-dom";


export type ReactDOMModuleExports = {
  createPortal: typeof ReactDOM.createPortal;
}

export type IReactDOMModuleExports = InterceptedModuleExports<ReactDOMModuleExports>;
let IReactDOMModule: IReactDOMModuleExports | null = null;

export function intercept(moduleId: string, moduleExports: ReactDOMModuleExports, failedExportsKeys?: ModuleExportsKeys<ReactDOMModuleExports>): IReactDOMModuleExports {
  if (!IReactDOMModule) {
    IReactDOMModule = interceptModuleExports(moduleId, moduleExports, ['createPortal'], failedExportsKeys);
  }
  return IReactDOMModule;
}
