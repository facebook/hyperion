/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export * as AutoLogging from './AutoLogging';
export type { InitOptions, ReactOptions } from './AutoLogging';
export {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  mapPropToEventType,
} from './ALConfig';
export type { ALConfig, ALFeature, ALFeatureConfig } from './ALConfig';
export type { ALChannel } from './ALChannel';
export {
  createLoggableEvent,
  createTransportEnvelope,
  getMobileEventContext,
} from './ALContract';
export {
  ALHeartbeatType,
  recordActivity,
  startHeartbeat,
  stopHeartbeat,
} from './ALHeartbeat';
export {
  ALSurface,
  ALSurfaceData,
  useSurface,
  useSurfaceMetadata,
  useSurfacePath,
  useSurfaceUIEventMetadata,
} from './ALSurface';
export type {
  ALSurfaceDataNode,
  ALSurfaceDataRoot,
  ALSurfaceProps,
} from './ALSurface';
export {
  extendSession,
  getAppInstanceId,
  getNextEventIndex,
  getScreenId,
  getSessionId,
  getWebSessionId,
  rotateScreenId,
} from './ALSession';
export { getCurrentScreen, setCurrentScreen } from './ALScreen';
export { useALListViewability } from './ALListViewability';
export type {
  ALListViewabilityOptions,
  ALListViewabilityResult,
  ALViewabilityConfig,
  ALViewabilityInfo,
  ALViewToken,
} from './ALListViewability';
export { logDeepLinkOpen } from './ALDeepLink';
export type { ALDeepLinkOptions } from './ALDeepLink';
export { logReactErrorBoundary } from './ALReactError';
export type { ALReactErrorInfo, ALReactErrorOptions } from './ALReactError';
export {
  extractElementInfo,
  extractElementText,
  extractLabel,
  isLoggingSuppressed,
  isTextInput,
} from './ALLabelExtraction';
export type { RNElementInfo, RNElementText } from './ALLabelExtraction';
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
export type {
  LegacyCallInterceptor,
  LegacyComponentPropsOptions,
  LegacyJSXRuntimeInterceptors,
  LegacyReactModuleInterceptors,
  LegacyReactOptions,
} from './ALLegacyAutoLogging';
export type {
  AppStateStatus,
  ReactNativeAppState,
  ReactNativeAppStateSubscription,
  ReactNativeModuleExports,
} from './IReactNative';
export type {
  JSXDevRuntimeModuleExports,
  JSXRuntimeModuleExports,
  ReactModuleExports,
} from './ReactNativeElementObservation';
