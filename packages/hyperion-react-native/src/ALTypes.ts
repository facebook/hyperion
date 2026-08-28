/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type {
  ALLoggableEvent as SharedALLoggableEvent,
  ALTransportEnvelope as SharedALTransportEnvelope,
} from 'hyperion-autologging/src/ALCommonTypes';
import type { ALHeartbeatType } from 'hyperion-autologging/src/ALHeartbeatType';
import type { ALSurfaceDataNodeContract } from 'hyperion-autologging/src/ALSurfaceContract';

export type SurfaceMetadataValue = string | number | boolean | null;
export type SurfaceMetadata = Readonly<Record<string, SurfaceMetadataValue>>;
export type UIEventMetadata = Readonly<Record<string, SurfaceMetadata>>;
export type ALLoggableEvent = SharedALLoggableEvent<SurfaceMetadataValue>;

export type ALSurfaceDataNodeContractType = ALSurfaceDataNodeContract<
  never,
  SurfaceMetadata
>;

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
  readonly event: string;
  readonly sourceProp: string;
  readonly surface?: string;
  readonly surfaceData?: ALSurfaceDataNodeContractType;
  readonly surfaceMetadata?: SurfaceMetadata;
  readonly reactComponentName?: string;
  readonly reactComponentStack?: readonly string[];
  readonly elementText?: string;
  readonly elementTextSource?: RNElementTextSource;
  readonly elementTextSourceType?: RNElementTextSourceType;
  readonly elementTextPotentiallySensitive?: boolean;
  readonly elementName?: string;
  readonly value?: unknown;
  readonly valueSource?: RNEventValueSource;
  readonly valueSourceType?: RNEventValueSourceType;
  readonly valuePotentiallySensitive?: boolean;
  readonly isDisabled?: true;
}

export interface ALSurfaceMutationEventData extends ALLoggableEvent {
  readonly event: 'mount_component' | 'unmount_component';
  readonly surface: string;
  readonly surfacePath: string;
  readonly surfaceData: ALSurfaceDataNodeContractType;
  readonly mountedDuration?: number;
}

export interface ALHeartbeatEventData extends ALLoggableEvent {
  readonly event: 'heartbeat';
  readonly heartbeatType: ALHeartbeatType;
}

export interface ALAppStateEventData extends ALLoggableEvent {
  readonly event: 'app_state_change';
  readonly appState: string;
}

export interface ALScreenTransitionEventData extends ALLoggableEvent {
  readonly event: 'screen_transition';
  readonly screen: string;
  readonly screenId: string;
  readonly previousScreen?: string;
  readonly previousScreenId?: string;
}

export interface ALListImpressionEventData extends ALLoggableEvent {
  readonly event: 'list_item_visible';
  readonly listName: string;
  readonly itemName?: string;
  readonly itemIndex?: number;
  readonly surface?: string;
  readonly surfaceMetadata?: SurfaceMetadata;
}

export type ALDeepLinkSource = 'initial_url' | 'url_event' | 'notification';

export interface ALDeepLinkEventData extends ALLoggableEvent {
  readonly event: 'deep_link_open';
  readonly source: ALDeepLinkSource;
  readonly targetURI: string;
}

export interface ALReactErrorEventData extends ALLoggableEvent {
  readonly event: 'error';
  readonly source: 'react_error_boundary';
  readonly errorName: string;
  readonly errorMessage?: string;
  readonly errorStack?: string;
  readonly boundaryName?: string;
  readonly errorCategory?: string;
  readonly reactComponentName?: string;
  readonly reactComponentStack?: string;
}

// A type alias keeps the finite event contract required by Channel.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ALReactNativeEventMap = {
  al_ui_event: [ALUIEventData];
  al_surface_mutation_event: [ALSurfaceMutationEventData];
  al_heartbeat_event: [ALHeartbeatEventData];
  al_app_state_event: [ALAppStateEventData];
  al_screen_transition_event: [ALScreenTransitionEventData];
  al_list_impression_event: [ALListImpressionEventData];
  al_deep_link_event: [ALDeepLinkEventData];
  al_react_error_event: [ALReactErrorEventData];
};

export interface ALMobileEventContext {
  readonly appName: string;
  readonly appSessionId: string;
  readonly sessionId: string;
  readonly appInstanceId: string;
  readonly screenId: string;
  readonly screen?: string;
}

export type ALTransportEnvelope<Event extends ALLoggableEvent> =
  SharedALTransportEnvelope<Event, ALMobileEventContext>;
