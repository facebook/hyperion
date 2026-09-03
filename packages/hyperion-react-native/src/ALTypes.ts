/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type {
  ALHeartbeatType,
  ALLoggableEvent as SharedALLoggableEvent,
} from 'hyperion-autologging-shared';
import type { ALSurfaceDataNode } from './ALSurface';

export type SurfaceMetadataValue = string | number | boolean | null;
export type ALLoggableEvent = SharedALLoggableEvent<SurfaceMetadataValue>;
export type SurfaceMetadata = Readonly<Record<string, SurfaceMetadataValue>>;
export type UIEventMetadata = Readonly<Record<string, SurfaceMetadata>>;
export type RNElementTextSource =
  | 'accessibilityLabel'
  | 'aria-label'
  | 'title'
  | 'testID'
  | 'placeholder';
export type RNElementTextSourceType =
  | 'developer_identifier'
  | 'application_text';
export type RNEventValueSource =
  | 'callback_argument'
  | 'native_event_text'
  | 'element_value_prop';
export type RNEventValueSourceType = 'user_input' | 'control_value';

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
  elementTextSourceType?: RNElementTextSourceType;
  elementTextPotentiallySensitive?: boolean;
  elementName?: string;
  value?: unknown;
  valueSource?: RNEventValueSource;
  valueSourceType?: RNEventValueSourceType;
  valuePotentiallySensitive?: boolean;
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

export type ALDeepLinkSource = 'initial_url' | 'url_event' | 'notification';

export interface ALDeepLinkEventData extends ALLoggableEvent {
  event: 'deep_link_open';
  source: ALDeepLinkSource;
  targetURI: string;
}

export interface ALReactErrorEventData extends ALLoggableEvent {
  event: 'error';
  source: 'react_error_boundary';
  errorName: string;
  errorMessage?: string;
  errorStack?: string;
  boundaryName?: string;
  errorCategory?: string;
  reactComponentName?: string;
  reactComponentStack?: string;
}

export interface ALLegacyReactComponentPropEventData {
  component: string;
  prop: string;
  args: unknown[];
  type: 'class' | 'func' | 'dom';
}

export interface ALLegacyReactComponentMountEventData {
  surface: string;
  args: unknown[];
}

// The channel constraint requires a finite mapped event contract.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ALModernChannelEventMap = {
  al_ui_event: [ALUIEventData];
  al_surface_mutation_event: [ALSurfaceMutationEventData];
  al_heartbeat_event: [ALHeartbeatEventData];
  al_app_state_event: [ALAppStateEventData];
  al_screen_transition_event: [ALScreenTransitionEventData];
  al_list_impression_event: [ALListImpressionEventData];
  al_deep_link_event: [ALDeepLinkEventData];
  al_react_error_event: [ALReactErrorEventData];
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ALLegacyChannelEventMap = {
  al_react_component_prop: [ALLegacyReactComponentPropEventData];
  al_react_component_mount: [ALLegacyReactComponentMountEventData];
};

export type ALChannelEventMap = ALModernChannelEventMap &
  ALLegacyChannelEventMap;

export interface ALMobileEventContext {
  appName: string;
  appSessionId: string;
  sessionId: string;
  appInstanceId: string;
  screenId: string;
  screen?: string;
}

export interface ALTransportEnvelope<Event extends ALLoggableEvent> {
  family: string;
  event: Event;
  context: ALMobileEventContext;
}
