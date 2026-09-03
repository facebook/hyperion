/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React, { useEffect, useInsertionEffect, useState } from 'react';
import type { Channel } from 'hyperion-channel/src/Channel';
import { getOriginalCreateElement } from './ReactNativeElementObservation';
import { mapPropToEventType, type ALConfig } from './ALConfig';
import type { ALRuntimeChannelEventMap } from './ALChannel';
import { createLoggableEvent, setIfDefined } from './ALContract';
import { recordActivity } from './ALHeartbeat';
import {
  extractElementInfo,
  extractElementText,
  extractEventValue,
  type RNEventValue,
  type RNElementInfo,
  type RNElementText,
} from './ALLabelExtraction';
import { getExplicitText, mergeMetadata } from './ALMetadata';
import { extendSession } from './ALSession';
import { useSurface, type ALSurfaceDataNode } from './ALSurface';

declare const __DEV__: boolean;

const SCROLL_DEBOUNCE_MS = 5_000;
const VALUE_CHANGE_DEBOUNCE_MS = 500;
const defaultCreateElement = React.createElement;
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
}

function createInstrumentationSnapshot(
  componentName: string | undefined,
  props: Readonly<Record<string, unknown>>,
  surface: ALSurfaceDataNode | null,
  debugOwnerStack?: readonly string[]
): InstrumentationSnapshot {
  const elementInfo = extractElementInfo(componentName, props);
  return {
    props,
    componentName: componentName ?? '(anonymous)',
    elementInfo,
    elementText: extractElementText(elementInfo),
    surface,
    debugOwnerStack,
  };
}

export interface ALInstrumentedElementOwnProps {
  originalType: React.ElementType;
  componentName?: string;
  config: ALConfig;
  channel: Channel<ALRuntimeChannelEventMap>;
  interceptProps: readonly string[];
}

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
  };
  return state;
}

function getStateHandler(
  state: InstrumentationRuntimeState,
  propName: string
): EventHandler {
  let handler = state.handlerCache.get(propName);
  if (handler == null) {
    handler = createStateHandlerWrapper(state, propName);
    instrumentedHandlers.add(handler);
    state.handlerCache.set(propName, handler);
  }
  return handler;
}

function disposeInstrumentationRuntimeState(
  state: InstrumentationRuntimeState
): void {
  if (state.valueChangeTimer != null) {
    clearTimeout(state.valueChangeTimer);
    state.valueChangeTimer = null;
  }
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

export function createALInstrumentedElementType(
  ownProps: ALInstrumentedElementOwnProps
): React.ForwardRefExoticComponent<Record<string, unknown>> {
  const installedCreateElement = getOriginalCreateElement();
  return React.forwardRef<unknown, Record<string, unknown>>(
    function ALInstrumentedElement(props, forwardedRef) {
      return renderALInstrumentedElement(
        props,
        forwardedRef,
        ownProps,
        installedCreateElement
      );
    }
  );
}

function renderALInstrumentedElement(
  props: Readonly<Record<string, unknown>>,
  forwardedRef: React.ForwardedRef<unknown>,
  {
    originalType,
    componentName,
    config,
    channel,
    interceptProps,
  }: ALInstrumentedElementOwnProps,
  installedCreateElement: ReturnType<typeof getOriginalCreateElement>
): React.ReactElement {
  const surface = useSurface();
  const snapshot = createInstrumentationSnapshot(
    componentName,
    props,
    surface,
    typeof __DEV__ !== 'undefined' && __DEV__ && config.debug === true
      ? getOwnerStack()
      : undefined
  );
  const [runtimeState] = useState(() =>
    createInstrumentationRuntimeState(snapshot, channel, config)
  );
  useInsertionEffect(() => {
    runtimeState.snapshot = snapshot;
    runtimeState.channel = channel;
    runtimeState.config = config;
  });
  useEffect(
    () => () => disposeInstrumentationRuntimeState(runtimeState),
    [runtimeState]
  );

  let renderedProps: Record<string, unknown> | null = null;
  for (const propName of interceptProps) {
    const handler = props[propName];
    if (typeof handler !== 'function' || isInstrumentedHandler(handler))
      continue;
    renderedProps ??= { ...props };
    renderedProps[propName] = getStateHandler(runtimeState, propName);
  }
  if (forwardedRef != null) {
    renderedProps ??= { ...props };
    renderedProps.ref = forwardedRef;
  }
  const elementProps = renderedProps ?? props;
  return (
    installedCreateElement == null
      ? defaultCreateElement.call(React, originalType, elementProps)
      : installedCreateElement.renderer.call(
          installedCreateElement.receiver,
          originalType,
          elementProps
        )
  ) as React.ReactElement;
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
  let eventValue: RNEventValue | undefined;
  try {
    eventValue = extractEventValue(propName, args, snapshot.elementInfo);
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
          eventValue
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
    emitUIEventSafely(state.channel, snapshot, eventType, propName, eventValue);
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
  valueInfo?: RNEventValue
): void {
  const loggable = createLoggableEvent();
  const surfaceMetadata = mergeMetadata(snapshot.surface?.interactiveMetadata);
  const eventMetadata = mergeMetadata(
    snapshot.surface?.uiEventMetadata[eventType]
  );
  const elementName =
    getExplicitText(snapshot.elementInfo.testID) ??
    getExplicitText(snapshot.componentName);
  const event = {
    ...loggable,
    event: eventType,
    sourceProp: propName,
    reactComponentName: snapshot.componentName,
    metadata: eventMetadata,
  };
  setIfDefined(event, 'surface', snapshot.surface?.interactivePath);
  setIfDefined(event, 'surfaceData', snapshot.surface);
  setIfDefined(
    event,
    'surfaceMetadata',
    Object.keys(surfaceMetadata).length === 0 ? undefined : surfaceMetadata
  );
  setIfDefined(event, 'reactComponentStack', snapshot.debugOwnerStack);
  setIfDefined(event, 'elementText', snapshot.elementText?.text);
  setIfDefined(event, 'elementTextSource', snapshot.elementText?.source);
  setIfDefined(
    event,
    'elementTextSourceType',
    snapshot.elementText?.sourceType
  );
  setIfDefined(
    event,
    'elementTextPotentiallySensitive',
    snapshot.elementText?.potentiallySensitive
  );
  setIfDefined(event, 'elementName', elementName);
  if (valueInfo != null) {
    (event as Record<string, unknown>).value = valueInfo.value;
  }
  setIfDefined(event, 'valueSource', valueInfo?.source);
  setIfDefined(event, 'valueSourceType', valueInfo?.sourceType);
  setIfDefined(
    event,
    'valuePotentiallySensitive',
    valueInfo?.potentiallySensitive
  );
  setIfDefined(
    event,
    'isDisabled',
    snapshot.elementInfo.isDisabled === true ? true : undefined
  );
  channel.emitSafely('al_ui_event', event);
}

function getOwnerStack(): readonly string[] | undefined {
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
