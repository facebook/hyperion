/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export * as AutoLogging from './AutoLogging';
export type { InitOptions } from './AutoLogging';
export type { PluginInitOptions } from './ALPluginAutoLogging';
export {
  Channel,
  Hook,
  PausableChannel,
  PipeableEmitter,
  ResilientChannel,
  createAutoLoggingChannel,
  type AutoLoggingChannel,
} from './channel';
export type {
  ALReactNativePlugin,
  ALReactNativeRuntimeContext,
} from './ALRuntime';
export type {
  JSXDevRuntimeModuleExports,
  JSXRuntimeModuleExports,
  ReactModuleExports,
} from './ReactNativeElementObservation';
export {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  mapPropToEventType,
} from './ALUIEvents';
export type { ALConfig, ALFeature, ALFeatureConfig } from './ALUIEvents';
export { createReactNativePlugins } from './ALCompatibility';
export type { CompatibilityInitOptions, ReactOptions } from './ALCompatibility';
export {
  reactNativeAppLifecycle,
  REACT_NATIVE_APP_LIFECYCLE_PLUGIN,
} from './ALAppLifecycle';
export type {
  ALAppStateListener,
  ReactNativeAppLifecycleOptions,
} from './ALAppLifecycle';
export { reactNativeAppStateEvents } from './ALAppStateEvents';
export { logDeepLinkOpen, reactNativeDeepLinks } from './ALDeepLink';
export type { ALDeepLinkOptions } from './ALDeepLink';
export {
  ALHeartbeatType,
  reactNativeHeartbeat,
  REACT_NATIVE_HEARTBEAT_PLUGIN,
} from './ALHeartbeat';
export type { ReactNativeHeartbeatOptions } from './ALHeartbeat';
export {
  MAX_DEDUPED_ITEMS_PER_SCREEN,
  reactNativeListImpressions,
  useALListViewability,
} from './ALListViewability';
export type {
  ALListViewabilityOptions,
  ALListViewabilityResult,
  ALViewabilityConfig,
  ALViewabilityInfo,
  ALViewToken,
} from './ALListViewability';
export {
  extractElementInfo,
  extractElementText,
  extractLabel,
  isLoggingSuppressed,
  isTextInput,
} from './ALUIEvents';
export type { RNElementInfo, RNElementText } from './ALUIEvents';
export {
  ALSurface,
  ALSurfaceData,
  reactNativeSurfaces,
  useSurface,
  useSurfaceMetadata,
  useSurfacePath,
  useSurfaceUIEventMetadata,
} from './ALSurface';
export type {
  ALSurfaceDataNode,
  ALSurfaceDataRoot,
  ALSurfaceProps,
  ReactNativeSurfacesOptions,
} from './ALSurface';
export { reactNativeUIEvents } from './ALUIEvents';
export type { ReactNativeUIEventsOptions } from './ALUIEvents';
export { logReactErrorBoundary, reactNativeReactErrors } from './ALReactError';
export type { ALReactErrorInfo, ALReactErrorOptions } from './ALReactError';
export {
  getCurrentScreen,
  reactNativeScreens,
  setCurrentScreen,
} from './ALScreen';
export type { ALScreenState } from './ALScreen';
export {
  extendSession,
  getAppInstanceId,
  getScreenId,
  getSessionId,
  getWebSessionId,
  recordActivity,
  rotateScreenId,
} from './ALSessionPublic';
export { createTransportEnvelope, getMobileEventContext } from './ALTransport';
export type {
  AppStateStatus,
  ReactNativeAppState,
  ReactNativeAppStateSubscription,
  ReactNativeModuleExports,
} from './IReactNative';
export type {
  LegacyAutoLoggingOptions,
  LegacyCallInterceptor,
  LegacyComponentPropsOptions,
  LegacyJSXRuntimeInterceptors,
  LegacyReactModuleInterceptors,
  LegacyReactOptions,
} from './ALLegacyAutoLogging';
export {
  createObservedJSXFunction,
  getJSXRuntimeBenchmarkPair,
  installReactNativeJSXRuntime,
  isElementInstrumenterInstalled,
  isElementObservationEnabled,
} from './ReactNativeElementObservation';
export type {
  ALAppStateEventData,
  ALChannelEventMap,
  ALDeepLinkEventData,
  ALDeepLinkSource,
  ALHeartbeatEventData,
  ALListImpressionEventData,
  ALLegacyChannelEventMap,
  ALLegacyReactComponentMountEventData,
  ALLegacyReactComponentPropEventData,
  ALLoggableEvent,
  ALMobileEventContext,
  ALModernChannelEventMap,
  ALReactErrorEventData,
  ALReactNativeEventMap,
  ALScreenTransitionEventData,
  ALSurfaceMutationEventData,
  ALTransportEnvelope,
  ALUIEventData,
  RNElementTextSource,
  RNElementTextSourceType,
  RNEventValueSource,
  RNEventValueSourceType,
  SurfaceMetadata,
  SurfaceMetadataValue,
  UIEventMetadata,
} from './ALTypes';
