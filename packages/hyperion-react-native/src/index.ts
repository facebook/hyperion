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
