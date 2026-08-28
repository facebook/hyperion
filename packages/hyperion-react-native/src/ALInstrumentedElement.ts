/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React, { useEffect, useInsertionEffect, useState } from 'react';
import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type { ALReactNativeRuntimeContext } from './ALRuntime';
import { mapPropToEventType } from './ALConfig';
import {
  extractElementInfo,
  extractElementText,
  extractEventValue,
  type RNElementInfo,
  type RNElementText,
  type RNEventValue,
} from './ALLabelExtraction';
import { getExplicitText, mergeMetadata } from './ALMetadata';
import { useSurface, type ALSurfaceDataNode } from './ALSurface';
import type { ALReactNativeEventMap, ALUIEventData } from './ALTypes';
import { getOriginalCreateElement } from './ReactNativeElementObservation';

declare const __DEV__: boolean;

const SCROLL_DEBOUNCE_MS = 5_000;
const VALUE_CHANGE_DEBOUNCE_MS = 500;
const defaultCreateElement = React.createElement;
type EventHandler = (this: unknown, ...args: unknown[]) => unknown;
const instrumentedHandlers = new WeakSet<EventHandler>();

export interface ReactNativeUIEventConfig {
  readonly debug: boolean;
  readonly interceptProps: readonly string[];
}

export interface ReactNativeUIEventController {
  active: boolean;
}

interface InstrumentationSnapshot {
  readonly props: Readonly<Record<string, unknown>>;
  readonly componentName: string;
  readonly elementInfo: RNElementInfo;
  readonly elementText?: RNElementText;
  readonly surface: ALSurfaceDataNode | null;
  readonly debugOwnerStack?: readonly string[];
}

interface InstrumentationRuntimeState {
  snapshot: InstrumentationSnapshot;
  channel: AutoLoggingChannel<ALReactNativeEventMap>;
  context: ALReactNativeRuntimeContext;
  controller: ReactNativeUIEventController;
  lastScrollTimestamp: number;
  valueChangeTimer: ReturnType<typeof setTimeout> | null;
  readonly handlerCache: Map<string, EventHandler>;
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
  readonly originalType: React.ElementType;
  readonly componentName?: string;
  readonly config: ReactNativeUIEventConfig;
  readonly channel: AutoLoggingChannel<ALReactNativeEventMap>;
  readonly context: ALReactNativeRuntimeContext;
  readonly controller: ReactNativeUIEventController;
}

function createInstrumentationRuntimeState(
  snapshot: InstrumentationSnapshot,
  channel: AutoLoggingChannel<ALReactNativeEventMap>,
  context: ALReactNativeRuntimeContext,
  controller: ReactNativeUIEventController
): InstrumentationRuntimeState {
  return {
    snapshot,
    channel,
    context,
    controller,
    lastScrollTimestamp: 0,
    valueChangeTimer: null,
    handlerCache: new Map(),
  };
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
    context,
    controller,
  }: ALInstrumentedElementOwnProps,
  installedCreateElement: ReturnType<typeof getOriginalCreateElement>
): React.ReactElement {
  const surface = useSurface();
  const snapshot = createInstrumentationSnapshot(
    componentName,
    props,
    surface,
    typeof __DEV__ !== 'undefined' && __DEV__ && config.debug
      ? getOwnerStack()
      : undefined
  );
  const [runtimeState] = useState(() =>
    createInstrumentationRuntimeState(snapshot, channel, context, controller)
  );
  useInsertionEffect(() => {
    runtimeState.snapshot = snapshot;
    runtimeState.channel = channel;
    runtimeState.context = context;
    runtimeState.controller = controller;
  });
  useEffect(
    () => () => disposeInstrumentationRuntimeState(runtimeState),
    [runtimeState]
  );

  let renderedProps: Record<string, unknown> | null = null;
  for (const propName of config.interceptProps) {
    const handler = props[propName];
    if (typeof handler !== 'function' || isInstrumentedHandler(handler)) {
      continue;
    }
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
  if (!state.controller.active) return handler.apply(receiver, args);
  const eventType = mapPropToEventType(propName);
  if (eventType === 'scroll') {
    const now = state.context.now();
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
        if (!state.controller.active) return;
        try {
          emitUIEvent(state, snapshot, eventType, propName, eventValue);
        } catch {
          // Deferred logging failures must not escape the timer callback.
        }
      }, VALUE_CHANGE_DEBOUNCE_MS);
      recordActivityWithoutAffectingHandler(state);
    } catch {
      // Timer failures must not affect the application handler.
    }
    return handler.apply(receiver, args);
  }
  try {
    emitUIEvent(state, snapshot, eventType, propName, eventValue);
  } catch {
    // Logging failures must not affect the application handler.
  }
  recordActivityWithoutAffectingHandler(state);
  return handler.apply(receiver, args);
}

function recordActivityWithoutAffectingHandler(
  state: InstrumentationRuntimeState
): void {
  try {
    state.context.session.recordActivity();
  } catch {
    // Activity tracking must not affect the application handler.
  }
}

function emitUIEvent(
  state: InstrumentationRuntimeState,
  snapshot: InstrumentationSnapshot,
  eventType: string,
  propName: string,
  valueInfo?: RNEventValue
): void {
  const surfaceMetadata = mergeMetadata(snapshot.surface?.interactiveMetadata);
  const eventMetadata = mergeMetadata(
    snapshot.surface?.uiEventMetadata[eventType]
  );
  const event = {
    ...state.context.eventFactory.createEvent({ metadata: eventMetadata }),
    event: eventType,
    sourceProp: propName,
    reactComponentName: snapshot.componentName,
  };
  const elementName =
    getExplicitText(snapshot.elementInfo.testID) ??
    getExplicitText(snapshot.componentName);
  setIfDefined(event, 'surface', snapshot.surface?.interactivePath);
  setIfDefined(event, 'surfaceData', snapshot.surface ?? undefined);
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
  setIfDefined(event, 'isDisabled', snapshot.elementInfo.isDisabled);
  state.channel.emit('al_ui_event', event as ALUIEventData);
}

function setIfDefined(target: object, key: string, value: unknown): void {
  if (value !== undefined) (target as Record<string, unknown>)[key] = value;
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
