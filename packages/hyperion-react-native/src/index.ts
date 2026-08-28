/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export * as AutoLogging from './AutoLogging';
export type { InitOptions } from './AutoLogging';
export {
  createAutoLoggingChannel,
  type AutoLoggingChannel,
} from 'hyperion-autologging/src/ALChannel';
export type {
  ALReactNativePlugin,
  ALReactNativeRuntimeContext,
} from './ALRuntime';
export type {
  JSXDevRuntimeModuleExports,
  JSXRuntimeModuleExports,
  ReactModuleExports,
} from './ReactNativeElementObservation';
export { DEFAULT_INTERCEPT_PROPS, mapPropToEventType } from './ALConfig';
export {
  extractElementInfo,
  extractElementText,
  extractLabel,
  isLoggingSuppressed,
  isTextInput,
} from './ALLabelExtraction';
export type { RNElementInfo, RNElementText } from './ALLabelExtraction';
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
export {
  createObservedJSXFunction,
  getJSXRuntimeBenchmarkPair,
  installReactNativeJSXRuntime,
  isElementInstrumenterInstalled,
  isElementObservationEnabled,
} from './ReactNativeElementObservation';
export type {
  ALAppStateEventData,
  ALDeepLinkEventData,
  ALDeepLinkSource,
  ALHeartbeatEventData,
  ALListImpressionEventData,
  ALLoggableEvent,
  ALMobileEventContext,
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
