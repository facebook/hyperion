/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type { FunctionInterceptor, InterceptableObjectType } from '@hyperion/hyperion-core/src/FunctionInterceptor';

import { ShadowPrototype, } from '@hyperion/hyperion-core/src/ShadowPrototype';
import { interceptMethod } from '@hyperion/hyperion-core/src/MethodInterceptor';
import { assert } from '@hyperion/global';

export type InterceptedModuleExports<TModuleExports extends InterceptableObjectType> = {
  [K in keyof TModuleExports]: FunctionInterceptor<TModuleExports, string, TModuleExports[K]>;
}
export type ModuleExportsKeys<TModuleExports extends InterceptableObjectType> = (keyof TModuleExports & string)[];

export function interceptModuleExports<TModuleExports extends InterceptableObjectType>(
  moduleId: string,
  moduleExports: TModuleExports,
  moduleExportsKeys: ModuleExportsKeys<TModuleExports>,
  failedExportsKeys?: ModuleExportsKeys<TModuleExports>
): InterceptedModuleExports<TModuleExports> {
  const ModuleExports: TModuleExports = moduleExports;
  const ModuleExportsShadow = new ShadowPrototype(ModuleExports, null);
  const IModule = {} as InterceptedModuleExports<TModuleExports>;
  for (let i = 0; i < moduleExportsKeys.length; ++i) {
    const key = moduleExportsKeys[i];
    IModule[key] = interceptMethod(key, ModuleExportsShadow);
  };

  // /**
  //  * Currently, the module system in Meta uses a different mechanism to import
  //  * normal vs. default modules. In order to make sure default exports are also
  //  * handled properly, we use the following back channel to grap the module data
  //  * and update the values.
  //  * See the details in https://www.internalfb.com/code/www/[diffs]/html/shared_core/polyfill/fbmodule-runtime.js?lines=373-378
  //  */
  // if (IModule.default != null) {
  //   __debug.modulesMap[moduleId].defaultExport = moduleExports.default;
  // }

  validateModuleInterceptor(moduleId, moduleExports, IModule, failedExportsKeys);
  return IModule;
}


export function validateModuleInterceptor<TModuleExports extends InterceptableObjectType>(
  moduleId: string,
  moduleExports: TModuleExports,
  moduleExportsInterceptors: InterceptedModuleExports<TModuleExports>,
  failedExportsKeys?: ModuleExportsKeys<TModuleExports>
) {
  if (Array.isArray(failedExportsKeys)) {
    const moduleExportsKeys = Object.keys(moduleExportsInterceptors);
    for (let i = 0; i < moduleExportsKeys.length; ++i) {
      const key = moduleExportsKeys[i];
      if (moduleExports[key] !== moduleExportsInterceptors[key].interceptor) {
        failedExportsKeys.push(key);
      }
    }
    assert(failedExportsKeys.length === 0, failedExportsKeys.map(key => `could not intercept ${moduleId}.${key}`).join("\n"));
  }
}
