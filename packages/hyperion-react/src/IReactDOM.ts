/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type ReactDOM from "react-dom";

import { InterceptedModuleExports, interceptModuleExports, ModuleExportsKeys } from 'hyperion-core/src/IRequire';
import { SafeGetterSetter } from "hyperion-util/src/SafeGetterSetter";

export type ReactDOMModuleExports = {
  createPortal: typeof ReactDOM.createPortal;
}

export type IReactDOMModuleExports = InterceptedModuleExports<ReactDOMModuleExports>;
const ReactDOMModule = new SafeGetterSetter<ReactDOMModuleExports>("ReactDOMModule");
const IReactDOMModule = new SafeGetterSetter<IReactDOMModuleExports>("IReactDOMModule");

export function intercept(moduleId: string, moduleExports: ReactDOMModuleExports, failedExportsKeys?: ModuleExportsKeys<ReactDOMModuleExports>): IReactDOMModuleExports {
  if (!IReactDOMModule.isSet()) {
    ReactDOMModule.set(moduleExports);
    IReactDOMModule.set(interceptModuleExports(moduleId, moduleExports, ['createPortal'], failedExportsKeys));
  }
  return IReactDOMModule.get();
}
