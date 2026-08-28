/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as AutoLogging from './ALPluginAutoLogging';

export { AutoLogging };
export default AutoLogging;
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
export {
  extendSession,
  getAppInstanceId,
  getScreenId,
  getSessionId,
  getWebSessionId,
  recordActivity,
  rotateScreenId,
} from './ALSessionPublic';
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
