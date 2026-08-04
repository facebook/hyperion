/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type {ALLoggableEvent as SharedALLoggableEvent} from 'hyperion-autologging/src/ALCommonTypes';
import type {ALHeartbeatType} from 'hyperion-autologging/src/ALHeartbeatType';
import type {ALSurfaceDataNode} from './ALSurface';

export type SurfaceMetadataValue = string | number | boolean | null;
export type ALLoggableEvent = SharedALLoggableEvent<SurfaceMetadataValue>;
export type SurfaceMetadata = Readonly<Record<string, SurfaceMetadataValue>>;
export type UIEventMetadata = Readonly<Record<string, SurfaceMetadata>>;
export type ALCustomEventLevel = 'debug' | 'info' | 'warn' | 'error';
export type ALCustomEventAttributes = SurfaceMetadata;
export type RNElementTextSource =
  | 'accessibilityLabel'
  | 'aria-label'
  | 'title'
  | 'testID'
  | 'placeholder';

export interface ALUIEventData extends ALLoggableEvent {
  event: string;
  sourceProp: string;
  surface?: string;
  surfaceData?: ALSurfaceDataNode;
  surfaceMetadata?: SurfaceMetadata;
  reactComponentName?: string;
  reactComponentStack?: readonly string[];
  elementText?: string;
  elementTextSource?: RNElementTextSource;
  elementName?: string;
  value?: string;
  isDisabled?: true;
}

export interface ALSurfaceMutationEventData extends ALLoggableEvent {
  event: 'mount_component' | 'unmount_component';
  surface: string;
  surfacePath: string;
  surfaceData: ALSurfaceDataNode;
  mountedDuration?: number;
}

export interface ALHeartbeatEventData extends ALLoggableEvent {
  event: 'heartbeat';
  heartbeatType: ALHeartbeatType;
}

export interface ALCustomEventData extends ALLoggableEvent {
  event: 'custom';
  eventName: string;
  level: ALCustomEventLevel;
  attributes?: ALCustomEventAttributes;
  surface?: string;
}

export interface ALAppStateEventData extends ALLoggableEvent {
  event: 'app_state_change';
  appState: string;
}

export interface ALScreenTransitionEventData extends ALLoggableEvent {
  event: 'screen_transition';
  screen: string;
  screenId: string;
  previousScreen?: string;
  previousScreenId?: string;
}

export interface ALListImpressionEventData extends ALLoggableEvent {
  event: 'list_item_visible';
  listName: string;
  itemName?: string;
  itemIndex?: number;
  surface?: string;
  surfaceMetadata?: SurfaceMetadata;
}

export type ALDeepLinkSource =
  | 'initial_url'
  | 'url_event'
  | 'notification';

export interface ALDeepLinkEventData extends ALLoggableEvent {
  event: 'deep_link_open';
  source: ALDeepLinkSource;
  targetURI: string;
}

export interface ALReactErrorEventData extends ALLoggableEvent {
  event: 'error';
  source: 'react_error_boundary';
  errorName: string;
  boundaryName?: string;
  errorCategory?: string;
  reactComponentName?: string;
  reactComponentStack?: readonly string[];
}

export type ALChannelEventMap = {
  al_ui_event: [ALUIEventData];
  al_surface_mutation_event: [ALSurfaceMutationEventData];
  al_heartbeat_event: [ALHeartbeatEventData];
  al_custom_event: [ALCustomEventData];
  al_app_state_event: [ALAppStateEventData];
  al_screen_transition_event: [ALScreenTransitionEventData];
  al_list_impression_event: [ALListImpressionEventData];
  al_deep_link_event: [ALDeepLinkEventData];
  al_react_error_event: [ALReactErrorEventData];
};

export interface ALMobileEventContext {
  appName: string;
  appSessionId: string;
  sessionId: string;
  appInstanceId: string;
  screenId: string;
  screen?: string;
  sampleRate: number;
}

export interface ALTransportEnvelope<Event extends ALLoggableEvent> {
  family: string;
  event: Event;
  context: ALMobileEventContext;
}
