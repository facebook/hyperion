/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React, { useEffect, useInsertionEffect, useState } from 'react';
import type { Channel } from 'hyperion-channel/src/Channel';
import type { InstrumentedElementProps } from './ReactNativeElementObservation';
import { mapPropToEventType, type ALConfig } from './ALConfig';
import type { ALRuntimeChannelEventMap } from './ALChannel';
import { createLoggableEvent } from './ALContract';
import { recordActivity } from './ALHeartbeat';
import {
  extractElementInfo,
  extractElementText,
  type RNElementInfo,
  type RNElementText,
} from './ALLabelExtraction';
import {
  getExplicitText,
  getSafeControlValue,
  mergeMetadata,
} from './ALPrivacy';
import { extendSession } from './ALSession';
import { useSurface, type ALSurfaceDataNode } from './ALSurface';

const SCROLL_DEBOUNCE_MS = 5_000;
const VALUE_CHANGE_DEBOUNCE_MS = 500;
type EventHandler = (this: unknown, ...args: unknown[]) => unknown;
const instrumentedHandlers = new WeakSet<EventHandler>();

interface InstrumentationSnapshot {
  props: Readonly<Record<string, unknown>>;
  componentName: string;
  elementInfo: RNElementInfo;
  elementText?: RNElementText;
  surface: ALSurfaceDataNode | null;
  debugOwnerStack?: readonly string[];
}

interface InstrumentationRuntimeState {
  snapshot: InstrumentationSnapshot;
  channel: Channel<ALRuntimeChannelEventMap>;
  config: ALConfig;
  lastScrollTimestamp: number;
  valueChangeTimer: ReturnType<typeof setTimeout> | null;
  handlerCache: Map<string, EventHandler>;
  commit(
    snapshot: InstrumentationSnapshot,
    channel: Channel<ALRuntimeChannelEventMap>,
    config: ALConfig
  ): void;
  getHandler(propName: string): EventHandler;
  dispose(): void;
}

export interface ALInstrumentedElementOwnProps {
  componentName?: string;
  config: ALConfig;
  channel: Channel<ALRuntimeChannelEventMap>;
  interceptProps: readonly string[];
}

export type ALInstrumentedElementProps = InstrumentedElementProps &
  ALInstrumentedElementOwnProps;

function createInstrumentationRuntimeState(
  snapshot: InstrumentationSnapshot,
  channel: Channel<ALRuntimeChannelEventMap>,
  config: ALConfig
): InstrumentationRuntimeState {
  const state: InstrumentationRuntimeState = {
    snapshot,
    channel,
    config,
    lastScrollTimestamp: 0,
    valueChangeTimer: null,
    handlerCache: new Map(),
    commit(nextSnapshot, nextChannel, nextConfig) {
      state.snapshot = nextSnapshot;
      state.channel = nextChannel;
      state.config = nextConfig;
    },
    getHandler(propName) {
      let handler = state.handlerCache.get(propName);
      if (handler == null) {
        handler = createStateHandlerWrapper(state, propName);
        instrumentedHandlers.add(handler);
        state.handlerCache.set(propName, handler);
      }
      return handler;
    },
    dispose() {
      if (state.valueChangeTimer != null) {
        clearTimeout(state.valueChangeTimer);
        state.valueChangeTimer = null;
      }
    },
  };
  return state;
}

export function isInstrumentedHandler(value: unknown): boolean {
  return (
    typeof value === 'function' &&
    instrumentedHandlers.has(value as EventHandler)
  );
}

export function hasInstrumentableEventProp(
  props: Readonly<Record<string, unknown>>,
  interceptProps: readonly string[]
): boolean {
  for (const propName of interceptProps) {
    if (!(propName in props)) continue;
    const handler = props[propName];
    if (
      typeof handler !== 'function' ||
      !instrumentedHandlers.has(handler as EventHandler)
    ) {
      return true;
    }
  }
  return false;
}

export function ALInstrumentedElement({
  originalType,
  originalProps,
  originalReceiver,
  originalArgumentCount,
  originalArg2,
  originalArg3,
  originalArg4,
  originalArg5,
  originalTrailingArgs,
  renderOriginal,
  componentName,
  config,
  channel,
  interceptProps,
}: ALInstrumentedElementProps): React.ReactNode {
  const surface = useSurface();
  const props = originalProps as Readonly<Record<string, unknown>>;
  const resolvedName = componentName ?? '(anonymous)';
  const elementInfo = extractElementInfo(componentName, props);
  const snapshot: InstrumentationSnapshot = {
    props,
    componentName: resolvedName,
    elementInfo,
    elementText: extractElementText(elementInfo),
    surface,
    debugOwnerStack: config.debug === true ? getOwnerStack() : undefined,
  };
  const [runtimeState] = useState(() =>
    createInstrumentationRuntimeState(snapshot, channel, config)
  );
  useInsertionEffect(() => {
    runtimeState.commit(snapshot, channel, config);
  });
  useEffect(() => () => runtimeState.dispose(), [runtimeState]);

  let handlerOverrides: Record<string, EventHandler> | null = null;
  for (const propName of interceptProps) {
    const handler = props[propName];
    if (typeof handler !== 'function' || isInstrumentedHandler(handler))
      continue;
    handlerOverrides ??= {};
    handlerOverrides[propName] = runtimeState.getHandler(propName);
  }
  const renderedProps =
    handlerOverrides == null ? props : { ...props, ...handlerOverrides };
  return renderOriginal(
    originalReceiver,
    originalType,
    renderedProps,
    originalArgumentCount,
    originalArg2,
    originalArg3,
    originalArg4,
    originalArg5,
    originalTrailingArgs
  ) as React.ReactNode;
}

function createStateHandlerWrapper(
  state: InstrumentationRuntimeState,
  propName: string
): EventHandler {
  return function (this: unknown, ...args: unknown[]) {
    return invokeInstrumentedHandler(state, propName, this, args);
  };
}

function invokeInstrumentedHandler(
  state: InstrumentationRuntimeState,
  propName: string,
  receiver: unknown,
  args: unknown[]
): unknown {
  const snapshot = state.snapshot;
  const handler = snapshot.props[propName];
  if (typeof handler !== 'function') return undefined;
  const eventType = mapPropToEventType(propName);
  if (eventType === 'scroll') {
    const now = Date.now();
    if (now - state.lastScrollTimestamp < SCROLL_DEBOUNCE_MS) {
      return handler.apply(receiver, args);
    }
    state.lastScrollTimestamp = now;
  }
  let safeValue: string | undefined;
  try {
    safeValue = getSafeControlValue(
      propName,
      args[0],
      snapshot.elementInfo.testID,
      state.config.controlValueAllowlist
    );
  } catch {
    // Value extraction must not affect the application handler.
  }
  if (propName === 'onValueChange' && typeof args[0] === 'number') {
    try {
      if (state.valueChangeTimer != null) clearTimeout(state.valueChangeTimer);
      state.valueChangeTimer = setTimeout(() => {
        state.valueChangeTimer = null;
        emitUIEventSafely(
          state.channel,
          snapshot,
          eventType,
          propName,
          safeValue
        );
      }, VALUE_CHANGE_DEBOUNCE_MS);
      recordActivity();
      extendSession();
    } catch {
      // Timer failures must not affect the application handler.
    }
    return handler.apply(receiver, args);
  }
  try {
    emitUIEventSafely(state.channel, snapshot, eventType, propName, safeValue);
    recordActivity();
    extendSession();
  } catch {
    // Logging failures must not affect the application handler.
  }
  return handler.apply(receiver, args);
}

function emitUIEventSafely(
  channel: Channel<ALRuntimeChannelEventMap>,
  snapshot: InstrumentationSnapshot,
  eventType: string,
  propName: string,
  value?: string
): void {
  const loggable = createLoggableEvent();
  const surfaceMetadata = mergeMetadata(
    snapshot.surface?.interactiveMetadata
  );
  const eventMetadata = mergeMetadata(
    snapshot.surface?.uiEventMetadata[eventType]
  );
  const elementName =
    getExplicitText(snapshot.elementInfo.testID) ??
    getExplicitText(snapshot.componentName);
  channel.emitSafely('al_ui_event', {
    ...loggable,
    event: eventType,
    sourceProp: propName,
    ...(snapshot.surface?.interactivePath
      ? { surface: snapshot.surface.interactivePath }
      : {}),
    ...(snapshot.surface == null ? {} : { surfaceData: snapshot.surface }),
    ...(Object.keys(surfaceMetadata).length === 0 ? {} : { surfaceMetadata }),
    reactComponentName: snapshot.componentName,
    ...(snapshot.debugOwnerStack == null
      ? {}
      : { reactComponentStack: snapshot.debugOwnerStack }),
    ...(snapshot.elementText == null
      ? {}
      : {
          elementText: snapshot.elementText.text,
          elementTextSource: snapshot.elementText.source,
        }),
    ...(elementName == null ? {} : { elementName }),
    ...(value === undefined ? {} : { value }),
    ...(snapshot.elementInfo.isDisabled === true ? { isDisabled: true } : {}),
    metadata: eventMetadata,
  });
}

function getOwnerStack(): readonly string[] | undefined {
  const isDevelopment =
    (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ === true;
  if (!isDevelopment) return undefined;
  try {
    const captureOwnerStack = (
      React as unknown as { captureOwnerStack?: () => string | null }
    ).captureOwnerStack;
    const rawStack = captureOwnerStack?.();
    if (!rawStack) return undefined;
    const stack = rawStack
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('at '))
      .map((line) => line.replace(/^at /, '').replace(/ \(.*\)$/, ''))
      .filter(Boolean);
    return stack.length === 0 ? undefined : stack;
  } catch {
    return undefined;
  }
}
