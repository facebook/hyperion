/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type React from 'react';
import {
  setElementInstrumenter,
  setElementObservationEnabled,
  type ElementInstrumenter,
} from './ReactNativeElementObservation';
import {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  type ALFeature,
  type ALConfig,
} from './ALConfig';
import {
  initALChannel,
  getALRuntimeChannel,
  resetALChannelForTests,
  type ALChannel,
} from './ALChannel';
import { createLoggableEvent, setIfDefined } from './ALContract';
import { stopHeartbeat } from './ALHeartbeat';
import {
  createALInstrumentedElementType,
  hasInstrumentableEventProp,
} from './ALInstrumentedElement';
import { isLoggingSuppressed } from './ALLabelExtraction';
import { getExplicitText, mergeMetadata } from './ALMetadata';
import { extendSession } from './ALSession';
import { resetALScreenForTests } from './ALScreen';
import { resetALSurfaceDataForTests } from './ALSurface';

let initialized = false;
let runtimeEnabled = false;
let runtimeConfig: ALConfig | null = null;

export function initializeAutoLogging(config: ALConfig): ALChannel {
  if (initialized) return initALChannel();
  initialized = true;
  runtimeConfig = { ...DEFAULT_CONFIG, ...config };
  const publicChannel = initALChannel();
  const channel = getALRuntimeChannel();
  if (channel == null) return publicChannel;
  runtimeEnabled = config.enabled !== false;
  if (!runtimeEnabled) {
    setElementObservationEnabled(false);
    return publicChannel;
  }

  if (isALFeatureEnabled('automaticUIEvents')) {
    const interceptProps = config.interceptProps ?? DEFAULT_INTERCEPT_PROPS;
    const skippedComponents = new Set([
      'View',
      'RCTView',
      'AnimatedComponent',
      'AnimatedComponentWrapper',
      'ForwardRef',
      'ForwardRef(React.Fragment)',
    ]);
    const instrumentedTypes = new WeakMap<object, unknown>();
    const elementInstrumenter: ElementInstrumenter = (type, props) => {
      if (props == null) return null;
      if (typeof type !== 'function' && typeof type !== 'object') return null;
      if (!hasInstrumentableEventProp(props, interceptProps)) return null;
      if (isLoggingSuppressed(props)) return null;
      const componentName = resolveComponentName(type);
      if (skippedComponents.has(componentName ?? '')) return null;
      if (
        componentName != null &&
        config.componentNameValidator != null &&
        !config.componentNameValidator(componentName)
      ) {
        return null;
      }
      let instrumentedType = instrumentedTypes.get(type as object);
      if (instrumentedType == null) {
        instrumentedType = createALInstrumentedElementType({
          originalType: type as React.ElementType,
          componentName,
          config: runtimeConfig ?? config,
          channel,
          interceptProps,
        });
        instrumentedTypes.set(type as object, instrumentedType);
      }
      return { type: instrumentedType };
    };
    setElementInstrumenter(elementInstrumenter);
    setElementObservationEnabled(true);
  } else {
    setElementInstrumenter(null);
    setElementObservationEnabled(false);
  }

  const surfaceMountEventIndexes = new WeakMap<object, number>();
  channel.addListener('al_surface_mount_request', (data) => {
    if (!isALFeatureEnabled('surfaceMutationEvents')) return;
    const event = {
      ...createLoggableEvent(data.timestamp),
      event: 'mount_component' as const,
      surface: data.surface,
      surfacePath: data.surfacePath,
      surfaceData: data.surfaceData,
      metadata: mergeMetadata(data.metadata),
    };
    surfaceMountEventIndexes.set(data.instance, event.eventIndex);
    channel.emitSafely('al_surface_mutation_event', event);
  });
  channel.addListener('al_surface_unmount_request', (data) => {
    if (!isALFeatureEnabled('surfaceMutationEvents')) return;
    const mountIndex = surfaceMountEventIndexes.get(data.instance);
    surfaceMountEventIndexes.delete(data.instance);
    channel.emitSafely('al_surface_mutation_event', {
      ...createLoggableEvent(data.timestamp, mountIndex),
      event: 'unmount_component',
      surface: data.surface,
      surfacePath: data.surfacePath,
      surfaceData: data.surfaceData,
      metadata: mergeMetadata(data.metadata),
      mountedDuration: data.mountedDuration,
    });
  });
  channel.addListener('al_heartbeat_request', (data) => {
    channel.emitSafely('al_heartbeat_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'heartbeat',
      heartbeatType: data.type,
    });
  });
  channel.addListener('al_app_state_request', (data) => {
    channel.emitSafely('al_app_state_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'app_state_change',
      appState: data.state,
    });
  });
  channel.addListener('al_custom_event_request', (data) => {
    if (!isALFeatureEnabled('customEvents')) return;
    const attributes = data.attributes;
    const level = data.level ?? 'info';
    const event = {
      ...createLoggableEvent(),
      event: 'custom',
      eventName: data.eventName,
      level,
      metadata: mergeMetadata(data.surfaceMetadata, attributes, { level }),
    } as const;
    setIfDefined(
      event,
      'attributes',
      attributes == null || Object.keys(attributes).length === 0
        ? undefined
        : attributes
    );
    setIfDefined(event, 'surface', data.surface);
    channel.emitSafely('al_custom_event', event);
  });
  channel.addListener('al_screen_transition_request', (data) => {
    if (!isALFeatureEnabled('screenTransitionEvents')) return;
    const event = {
      ...createLoggableEvent(data.timestamp),
      event: 'screen_transition',
      screen: data.screen,
      screenId: data.screenId,
      metadata: mergeMetadata(data.metadata),
    } as const;
    setIfDefined(event, 'previousScreen', data.previousScreen);
    setIfDefined(event, 'previousScreenId', data.previousScreenId);
    channel.emitSafely('al_screen_transition_event', event);
    extendSession();
  });
  channel.addListener('al_list_impression_request', (data) => {
    if (!isALFeatureEnabled('listImpressionEvents')) return;
    const listName = getExplicitText(data.listName);
    if (listName == null) return;
    const itemName = getExplicitText(data.itemName);
    const itemIndex =
      Number.isInteger(data.itemIndex) && (data.itemIndex ?? -1) >= 0
        ? data.itemIndex ?? undefined
        : undefined;
    const surfaceMetadata = mergeMetadata(data.surfaceMetadata);
    const event = {
      ...createLoggableEvent(data.timestamp),
      event: 'list_item_visible',
      listName,
      metadata: mergeMetadata(data.metadata),
    } as const;
    setIfDefined(event, 'itemName', itemName);
    setIfDefined(event, 'itemIndex', itemIndex);
    setIfDefined(event, 'surface', data.surface);
    setIfDefined(
      event,
      'surfaceMetadata',
      Object.keys(surfaceMetadata).length === 0 ? undefined : surfaceMetadata
    );
    channel.emitSafely('al_list_impression_event', event);
  });
  channel.addListener('al_deep_link_request', (data) => {
    if (!isALFeatureEnabled('deepLinkEvents')) return;
    channel.emitSafely('al_deep_link_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'deep_link_open',
      source: data.source,
      targetURI: data.targetURI,
      metadata: mergeMetadata(data.metadata),
    });
  });
  channel.addListener('al_react_error_request', (data) => {
    if (!isALFeatureEnabled('reactErrorEvents')) return;
    const event = {
      ...createLoggableEvent(data.timestamp),
      event: 'error',
      source: 'react_error_boundary',
      errorName: data.errorName,
    } as const;
    setIfDefined(event, 'errorMessage', data.errorMessage);
    setIfDefined(event, 'errorStack', data.errorStack);
    setIfDefined(event, 'boundaryName', data.boundaryName);
    setIfDefined(event, 'errorCategory', data.errorCategory);
    setIfDefined(event, 'reactComponentStack', data.reactComponentStack);
    channel.emitSafely('al_react_error_event', event);
  });
  return publicChannel;
}

export function isALRuntimeEnabled(): boolean {
  return runtimeEnabled;
}

export function isALFeatureEnabled(feature: ALFeature): boolean {
  return runtimeEnabled && runtimeConfig?.features?.[feature] !== false;
}

export function getALRuntimeConfig(): ALConfig | null {
  return runtimeConfig;
}

export function resolveComponentName(type: unknown): string | undefined {
  if (typeof type === 'function') {
    const component = type as { displayName?: string; name?: string };
    return component.displayName ?? component.name ?? undefined;
  }
  if (typeof type === 'object' && type != null) {
    const component = type as {
      type?: unknown;
      render?: ((...args: never[]) => unknown) & {
        displayName?: string;
        name?: string;
      };
      displayName?: string;
    };
    if (component.type != null) {
      const nested = resolveComponentName(component.type);
      if (nested != null) return nested;
    }
    if (typeof component.render === 'function') {
      return component.render.displayName ?? component.render.name ?? undefined;
    }
    return component.displayName;
  }
  return undefined;
}

export function resetALRuntimeForTests(): void {
  stopHeartbeat();
  setElementObservationEnabled(false);
  setElementInstrumenter(null);
  initialized = false;
  runtimeEnabled = false;
  runtimeConfig = null;
  resetALScreenForTests();
  resetALSurfaceDataForTests();
  resetALChannelForTests();
}
