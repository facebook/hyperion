/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React, {createContext, useContext, useEffect, useMemo} from 'react';
import {
  setElementInstrumenter,
  setElementObservationEnabled,
  type ElementInstrumenter,
} from './ReactNativeElementObservation';
import {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  type ALConfig,
} from './ALConfig';
import {
  initALChannel,
  getALRuntimeChannel,
  resetALChannelForTests,
  type ALChannel,
} from './ALChannel';
import {createLoggableEvent} from './ALContract';
import {startHeartbeat, stopHeartbeat} from './ALHeartbeat';
import {
  ALInstrumentedElement,
  hasInstrumentableEventProp,
} from './ALInstrumentedElement';
import {isLoggingSuppressed} from './ALLabelExtraction';
import {
  MAX_COMPONENT_STACK_DEPTH,
  sanitizeCustomAttributes,
  sanitizeErrorName,
  sanitizeLabel,
  sanitizeMetadata,
  sanitizeStableIdentifier,
  sanitizeStableTargetURI,
} from './ALPrivacy';
import {normalizeSampleRate, shouldSampleSession} from './ALSampling';
import {extendSession} from './ALSession';
import {resetALScreenForTests} from './ALScreen';
import {resetALSurfaceDataForTests} from './ALSurface';

export interface ALContextValue {
  config: ALConfig;
  channel: ALChannel;
}

const ALContext = createContext<ALContextValue | null>(null);

export function useAL(): ALContextValue | null {
  return useContext(ALContext);
}

let initialized = false;
let sampledIn = false;
let runtimeConfig: ALConfig | null = null;
let elementInstrumenter: ElementInstrumenter | null = null;

export function initializeAutoLogging(config: ALConfig): ALChannel {
  if (initialized) return initALChannel();
  initialized = true;
  const normalizedRate = normalizeSampleRate(config.sampleRate);
  runtimeConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    sampleRate: normalizedRate,
  };
  const publicChannel = initALChannel();
  const channel = getALRuntimeChannel();
  if (channel == null) return publicChannel;
  sampledIn = config.enabled !== false && shouldSampleSession(normalizedRate);
  if (!sampledIn) {
    setElementObservationEnabled(false);
    return publicChannel;
  }

  const interceptProps = config.interceptProps ?? DEFAULT_INTERCEPT_PROPS;
  const skippedComponents = new Set([
    'View',
    'RCTView',
    'AnimatedComponent',
    'AnimatedComponentWrapper',
    'ForwardRef',
    'ForwardRef(React.Fragment)',
  ]);
  elementInstrumenter = (type, props) => {
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
    return {
      type: ALInstrumentedElement,
      props: {componentName, config: runtimeConfig, channel, interceptProps},
    };
  };
  setElementInstrumenter(elementInstrumenter);
  setElementObservationEnabled(true);

  const surfaceMountEventIndexes = new WeakMap<object, number>();
  channel.addListener('al_surface_mount_request', data => {
    const event = {
      ...createLoggableEvent(data.timestamp),
      event: 'mount_component' as const,
      surface: data.surface,
      surfacePath: data.surfacePath,
      surfaceData: data.surfaceData,
      metadata: sanitizeMetadata(data.metadata),
    };
    surfaceMountEventIndexes.set(data.instance, event.eventIndex);
    channel.emitSafely('al_surface_mutation_event', event);
  });
  channel.addListener('al_surface_unmount_request', data => {
    const mountIndex = surfaceMountEventIndexes.get(data.instance);
    surfaceMountEventIndexes.delete(data.instance);
    channel.emitSafely('al_surface_mutation_event', {
      ...createLoggableEvent(data.timestamp, mountIndex),
      event: 'unmount_component',
      surface: data.surface,
      surfacePath: data.surfacePath,
      surfaceData: data.surfaceData,
      metadata: sanitizeMetadata(data.metadata),
      mountedDuration: data.mountedDuration,
    });
  });
  channel.addListener('al_heartbeat_request', data => {
    channel.emitSafely('al_heartbeat_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'heartbeat',
      heartbeatType: data.type,
    });
  });
  channel.addListener('al_app_state_request', data => {
    channel.emitSafely('al_app_state_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'app_state_change',
      appState: data.state,
    });
  });
  channel.addListener('al_custom_event_request', data => {
    const attributes = sanitizeCustomAttributes(data.attributes);
    const level = data.level ?? 'info';
    channel.emitSafely('al_custom_event', {
      ...createLoggableEvent(),
      event: 'custom',
      eventName: data.eventName,
      level,
      ...(Object.keys(attributes).length === 0 ? {} : {attributes}),
      ...(data.surface == null ? {} : {surface: data.surface}),
      metadata: sanitizeMetadata(data.surfaceMetadata, attributes, {level}),
    });
  });
  channel.addListener('al_screen_transition_request', data => {
    channel.emitSafely('al_screen_transition_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'screen_transition',
      screen: data.screen,
      screenId: data.screenId,
      ...(data.previousScreen == null
        ? {}
        : {previousScreen: data.previousScreen}),
      ...(data.previousScreenId == null
        ? {}
        : {previousScreenId: data.previousScreenId}),
      metadata: sanitizeMetadata(data.metadata),
    });
    extendSession();
  });
  channel.addListener('al_list_impression_request', data => {
    const listName = sanitizeLabel(data.listName);
    if (listName == null) return;
    const itemName = sanitizeLabel(data.itemName);
    const itemIndex =
      Number.isInteger(data.itemIndex) && (data.itemIndex ?? -1) >= 0
        ? data.itemIndex ?? undefined
        : undefined;
    const surfaceMetadata = sanitizeMetadata(data.surfaceMetadata);
    channel.emitSafely('al_list_impression_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'list_item_visible',
      listName,
      ...(itemName == null ? {} : {itemName}),
      ...(itemIndex == null ? {} : {itemIndex}),
      ...(data.surface == null ? {} : {surface: data.surface}),
      ...(Object.keys(surfaceMetadata).length === 0
        ? {}
        : {surfaceMetadata}),
      metadata: sanitizeMetadata(data.metadata),
    });
  });
  channel.addListener('al_deep_link_request', data => {
    const targetURI = sanitizeStableTargetURI(data.targetURI);
    if (targetURI == null) return;
    channel.emitSafely('al_deep_link_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'deep_link_open',
      source: data.source,
      targetURI,
      metadata: sanitizeMetadata(data.metadata),
    });
  });
  channel.addListener('al_react_error_request', data => {
    const stack = data.reactComponentStack
      ?.slice(0, MAX_COMPONENT_STACK_DEPTH)
      .map(sanitizeStableIdentifier)
      .filter((name): name is string => name != null);
    channel.emitSafely('al_react_error_event', {
      ...createLoggableEvent(data.timestamp),
      event: 'error',
      source: 'react_error_boundary',
      errorName: sanitizeErrorName(data.errorName),
      ...(sanitizeStableIdentifier(data.boundaryName) == null
        ? {}
        : {boundaryName: sanitizeStableIdentifier(data.boundaryName)}),
      ...(sanitizeStableIdentifier(data.errorCategory) == null
        ? {}
        : {errorCategory: sanitizeStableIdentifier(data.errorCategory)}),
      ...(stack?.[0] == null ? {} : {reactComponentName: stack[0]}),
      ...(stack == null || stack.length === 0
        ? {}
        : {reactComponentStack: stack}),
    });
  });
  return publicChannel;
}

export interface ALProviderProps {
  config: ALConfig;
  children?: React.ReactNode;
}

export function ALProvider({
  config,
  children,
}: ALProviderProps): React.ReactElement {
  const mergedConfig = useMemo<ALConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
      sampleRate: normalizeSampleRate(config.sampleRate),
    }),
    [config],
  );
  const channel = useMemo(
    () => initializeAutoLogging(mergedConfig),
    [mergedConfig],
  );
  useEffect(() => {
    if (sampledIn && mergedConfig.heartbeatInterval !== false) {
      startHeartbeat(
        mergedConfig.heartbeatInterval,
        mergedConfig.maxUserInactivityDuration,
      );
    }
    return stopHeartbeat;
  }, [
    mergedConfig.heartbeatInterval,
    mergedConfig.maxUserInactivityDuration,
  ]);
  const value = useMemo(() => ({config: mergedConfig, channel}), [
    channel,
    mergedConfig,
  ]);
  return React.createElement(ALContext.Provider, {value}, children);
}

export function isALRuntimeSampledIn(): boolean {
  return sampledIn;
}

export function getALRuntimeConfig(): ALConfig | null {
  return runtimeConfig;
}

export function resolveComponentName(type: unknown): string | undefined {
  if (typeof type === 'function') {
    const component = type as Function & {displayName?: string};
    return component.displayName ?? component.name ?? undefined;
  }
  if (typeof type === 'object' && type != null) {
    const component = type as {
      type?: unknown;
      render?: Function & {displayName?: string};
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
  elementInstrumenter = null;
  initialized = false;
  sampledIn = false;
  runtimeConfig = null;
  resetALScreenForTests();
  resetALSurfaceDataForTests();
  resetALChannelForTests();
}
