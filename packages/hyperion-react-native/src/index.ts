/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export * as AutoLogging from "./AutoLogging";
export {
  ALProvider,
  initializeAutoLogging,
  initializeAutoLogging as configureAutoLogging,
  isALRuntimeSampledIn,
  resolveComponentName,
  useAL,
} from './ALProvider';
export {DEFAULT_CONFIG, DEFAULT_INTERCEPT_PROPS, mapPropToEventType} from './ALConfig';
export type {ALConfig} from './ALConfig';
export {initALChannel, getALChannel, addChannelSubscriber} from './ALChannel';
export type {ALChannel} from './ALChannel';
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
export {getCurrentScreen, setCurrentScreen} from './ALScreen';
export {
  extractElementInfo,
  extractElementText,
  extractLabel,
  isLoggingSuppressed,
  isTextInput,
} from './ALLabelExtraction';
export type { RNElementInfo, RNElementText } from './ALLabelExtraction';
export {
  getSafeControlValue,
  sanitizeCustomAttributes,
  sanitizeErrorName,
  sanitizeLabel,
  sanitizeMetadata,
  sanitizeReactComponentStack,
  sanitizeStableIdentifier,
  sanitizeStableTargetURI,
} from './ALPrivacy';
export {normalizeSampleRate, shouldSampleSession} from './ALSampling';
export {
  createObservedJSXFunction,
  getJSXRuntimeBenchmarkPair,
  installReactNativeJSXRuntime,
  isElementObservationEnabled,
  setElementObservationEnabled,
} from 'hyperion-react/src/ReactElementObservation';
export type {
  ALAppStateEventData,
  ALChannelEventMap,
  ALCustomEventAttributes,
  ALCustomEventData,
  ALCustomEventLevel,
  ALDeepLinkEventData,
  ALDeepLinkSource,
  ALHeartbeatEventData,
  ALListImpressionEventData,
  ALLoggableEvent,
  ALMobileEventContext,
  ALReactErrorEventData,
  ALScreenTransitionEventData,
  ALSurfaceMutationEventData,
  ALTransportEnvelope,
  ALUIEventData,
  RNElementTextSource,
  SurfaceMetadata,
  SurfaceMetadataValue,
  UIEventMetadata,
} from './ALTypes';
