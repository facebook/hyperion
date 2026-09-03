/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export {
  Channel as MobileChannel,
  PausableChannel as MobilePausableChannel,
  PipeableEmitter as MobilePipeableEmitter,
} from '../packages/hyperion-channel/src/index.js';
export { Hook as MobileHook } from '../packages/hyperion-hook/src/index.js';
export {
  IGlobalThis as MobileIGlobalThis,
  IPromise as MobileIPromise,
  IRequire as MobileIRequire,
  getFunctionInterceptor as MobileGetFunctionInterceptor,
  getOwnShadowPrototypeOf as MobileGetOwnShadowPrototypeOf,
  getVirtualPropertyValue as MobileGetVirtualPropertyValue,
  intercept as MobileIntercept,
  interceptConstructor as MobileInterceptConstructor,
  interceptConstructorMethod as MobileInterceptConstructorMethod,
  interceptFunction as MobileInterceptFunction,
  interceptMethod as MobileInterceptMethod,
  registerShadowPrototype as MobileRegisterShadowPrototype,
  setVirtualPropertyValue as MobileSetVirtualPropertyValue,
} from '../packages/hyperion-core/src/index.js';
export {
  AttributeInterceptor as MobileAttributeInterceptor,
  AttributeInterceptorBase as MobileAttributeInterceptorBase,
  interceptAttribute as MobileInterceptAttribute,
  interceptAttributeBase as MobileInterceptAttributeBase,
} from '../packages/hyperion-core/src/AttributeInterceptor.js';
export {
  Catch as MobilePromiseCatch,
  IPromisePrototype as MobileIPromisePrototype,
  all as MobilePromiseAll,
  allSettled as MobilePromiseAllSettled,
  any as MobilePromiseAny,
  constructor as MobilePromiseConstructor,
  race as MobilePromiseRace,
  reject as MobilePromiseReject,
  resolve as MobilePromiseResolve,
  then as MobilePromiseThen,
} from '../packages/hyperion-core/src/IPromise.js';
export {
  setInterval as MobileSetInterval,
  setTimeout as MobileSetTimeout,
} from '../packages/hyperion-core/src/IGlobalThis.js';
export {
  getObjectExtension as MobileGetObjectExtension,
  registerShadowPrototypeGetter as MobileRegisterShadowPrototypeGetter,
} from '../packages/hyperion-core/src/intercept.js';
export { ShadowPrototype as MobileShadowPrototype } from '../packages/hyperion-core/src/ShadowPrototype.js';
export {
  interceptModuleExports as MobileInterceptModuleExports,
  validateModuleInterceptor as MobileValidateModuleInterceptor,
} from '../packages/hyperion-core/src/IRequire.js';
export {
  IReact as MobileIReact,
  IReactComponent as MobileIReactComponent,
  IReactDOM as MobileIReactDOM,
} from '../packages/hyperion-react/src/index.js';
export {
  createObservedJSXFunction as MobileCreateObservedJSXFunction,
  getJSXRuntimeBenchmarkPair as MobileGetJSXRuntimeBenchmarkPair,
  installReactNativeJSXRuntime as MobileInstallReactNativeJSXRuntime,
  isElementInstrumenterInstalled as MobileIsElementInstrumenterInstalled,
  isElementObservationEnabled as MobileIsElementObservationEnabled,
  setElementInstrumenter as MobileSetElementInstrumenter,
  setElementObservationEnabled as MobileSetElementObservationEnabled,
} from '../packages/hyperion-react-native/dist/ReactNativeElementObservation.js';
export { ReactModule as MobileReactModule } from '../packages/hyperion-react/src/IReact.js';
export {
  init as MobileReactInit,
  onReactClassComponentElement as MobileOnReactClassComponentElement,
  onReactClassComponentIntercept as MobileOnReactClassComponentIntercept,
  onReactDOMElement as MobileOnReactDOMElement,
  onReactFunctionComponentElement as MobileOnReactFunctionComponentElement,
  onReactFunctionComponentIntercept as MobileOnReactFunctionComponentIntercept,
  onReactSpecialObjectElement as MobileOnReactSpecialObjectElement,
} from '../packages/hyperion-react/src/IReactComponent.js';
export {
  ALHeartbeatType as MobileALHeartbeatType,
  ALSurfaceHierarchyNode as MobileALSurfaceHierarchyNode,
} from '../packages/hyperion-autologging-shared/dist/index.js';
export { onDOMMutation as MobileOnDOMMutation } from '../packages/hyperion-util/src/SyncMutationObserver.js';
export { TestAndSet as MobileTestAndSet } from '../packages/hyperion-test-and-set/src/index.js';
export { trackElementsWithAttributes as MobileTrackElementsWithAttributes } from '../packages/hyperion-util/src/trackElementsWithAttributes.js';
export {
  ClientSessionID as MobileClientSessionID,
  CookiePersistentData as MobileCookiePersistentData,
  CookieStorage as MobileCookieStorage,
  LocalStoragePersistentData as MobileLocalStoragePersistentData,
  SafeGetterSetter as MobileSafeGetterSetter,
  SessionPersistentData as MobileSessionPersistentData,
  guid as MobileGuid,
} from '../packages/hyperion-util/src/index.js';
