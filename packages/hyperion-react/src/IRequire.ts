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

class ModuleRuntimeBase {
  getExports<TModuleExports extends InterceptableObjectType>(_moduleId: string): TModuleExports | null {
    return null;
  }

  updateExports<TModuleExports extends InterceptableObjectType>(
    _moduleId: string,
    _moduleExports: TModuleExports,
    _moduleExportsInterceptors: InterceptedModuleExports<TModuleExports>,
    _failedExportsKeys?: ModuleExportsKeys<TModuleExports>
  ): void {
  }
}

/**
 * If the app is build with Webpack, we can find the following variable that hosts the exports
 * That way, we can get access to the behind the scene objects and update them with intercepted values. 
 */
declare var __webpack_module_cache__: { [key: string]: { exports: object } } | undefined;
class WebpackModuleRuntime extends ModuleRuntimeBase {
  constructor(private _cache: NonNullable<typeof __webpack_module_cache__>) {
    super();
  }
  getExports<T>(moduleId: string) {
    const modulePath = new RegExp(`${moduleId}(?:/index)?[.]js$`);
    const wexports = Object.keys(this._cache).filter(m => modulePath.test(m)).map(m => this._cache[m]);
    return wexports[0].exports as unknown as T;
  }
}

/**
 * For internal Meta apps, we use a custom runtime to manage modules and can access the exports
 * via the following global variable.
 */
declare var __debug: { modulesMap: { [key: string]: { defaultExport: object } } } | undefined;
class MetaModuleRuntime extends ModuleRuntimeBase {
  constructor(private _cache: NonNullable<typeof __debug>) {
    super();
  }
  updateExports<TModuleExports extends InterceptableObjectType>(
    moduleId: string,
    moduleExports: TModuleExports,
    moduleExportsInterceptors: InterceptedModuleExports<TModuleExports>,
    _failedExportsKeys?: ModuleExportsKeys<TModuleExports>
  ): void {
    /**
  * Currently, the module system in Meta uses a different mechanism to import
  * normal vs. default modules. In order to make sure default exports are also
  * handled properly, we use the following back channel to grap the module data
  * and update the values.
  * See the details in https://www.internalfb.com/code/www/[diffs]/html/shared_core/polyfill/fbmodule-runtime.js?lines=373-378
  */
    if (moduleExportsInterceptors.default != null) {
      this._cache.modulesMap[moduleId].defaultExport = moduleExports.default;
    }
  }
}

const ModuleRuntime: ModuleRuntimeBase = (() => {
  if (typeof __webpack_module_cache__ === 'object') {
    // In webpack world
    return new WebpackModuleRuntime(__webpack_module_cache__);
  } else if (typeof __debug === "object") {
    // In Meta custom runtime world
    return new MetaModuleRuntime(__debug);
  }
  return new ModuleRuntimeBase();
})();

export function interceptModuleExports<TModuleExports extends InterceptableObjectType>(
  moduleId: string,
  moduleExports: TModuleExports,
  moduleExportsKeys: ModuleExportsKeys<TModuleExports>,
  failedExportsKeys?: ModuleExportsKeys<TModuleExports>
): InterceptedModuleExports<TModuleExports> {
  let interceptableModuleExports: TModuleExports = moduleExports;
  const alternativeExports = ModuleRuntime.getExports<TModuleExports>(moduleId);

  if (alternativeExports && alternativeExports !== interceptableModuleExports) {
    console.warn('different exports objects ', moduleId);
    interceptableModuleExports = alternativeExports;
  }

  const ModuleExportsShadow = new ShadowPrototype(interceptableModuleExports, null);
  const IModule = {} as InterceptedModuleExports<TModuleExports>;
  for (let i = 0; i < moduleExportsKeys.length; ++i) {
    const key = moduleExportsKeys[i];
    IModule[key] = interceptMethod(key, ModuleExportsShadow);
  };

  ModuleRuntime.updateExports(moduleId, moduleExports, IModule, failedExportsKeys)

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
