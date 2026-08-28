/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Root from '../src';
import * as PluginBarrel from '../src/plugins';
import AppLifecycle from '../src/ALAppLifecycle';
import AppStateEvents from '../src/ALAppStateEvents';
import DeepLinks, {
  logDeepLinkOpen,
  reactNativeDeepLinks,
} from '../src/ALDeepLink';
import Heartbeat from '../src/ALHeartbeat';
import ListImpressions, {
  reactNativeListImpressions,
  useALListViewability,
} from '../src/ALListViewability';
import ReactErrors, {
  logReactErrorBoundary,
  reactNativeReactErrors,
} from '../src/ALReactError';
import Screens, {
  getCurrentScreen,
  reactNativeScreens,
  setCurrentScreen,
} from '../src/ALScreen';
import Transport from '../src/ALTransport';
import {
  reactNativeAppLifecycle,
  reactNativeAppStateEvents,
  reactNativeHeartbeat,
} from '../src/lifecycle';
import Lifecycle from '../src/lifecycle';
import {
  AutoLogging,
  Channel,
  Hook,
  PausableChannel,
  PipeableEmitter,
  ResilientChannel,
  createAutoLoggingChannel,
  type ALReactNativeEventMap,
} from '../src/runtime';
import Runtime from '../src/runtime';
import Surfaces, {
  ALSurface,
  ALSurfaceData,
  reactNativeSurfaces,
} from '../src/surfaces';
import UIEvents, { reactNativeUIEvents } from '../src/ui-events';

describe('React Native capability entries', () => {
  afterEach(() => AutoLogging.dispose());

  test('preserve the root and complete plugin-barrel exports', () => {
    expect(Root.reactNativeSurfaces).toBe(reactNativeSurfaces);
    expect(Root.reactNativeUIEvents).toBe(reactNativeUIEvents);
    expect(Root.reactNativeAppLifecycle).toBe(reactNativeAppLifecycle);
    expect(Root.reactNativeHeartbeat).toBe(reactNativeHeartbeat);
    expect(Root.reactNativeAppStateEvents).toBe(reactNativeAppStateEvents);
    expect(Root.reactNativeScreens).toBe(reactNativeScreens);
    expect(Root.reactNativeListImpressions).toBe(reactNativeListImpressions);
    expect(Root.reactNativeDeepLinks).toBe(reactNativeDeepLinks);
    expect(Root.reactNativeReactErrors).toBe(reactNativeReactErrors);

    expect(PluginBarrel.AutoLogging).toBe(AutoLogging);
    expect(PluginBarrel.ALSurface).toBe(ALSurface);
    expect(PluginBarrel.ALSurfaceData).toBe(ALSurfaceData);
    expect(PluginBarrel.getCurrentScreen).toBe(getCurrentScreen);
    expect(PluginBarrel.setCurrentScreen).toBe(setCurrentScreen);
    expect(PluginBarrel.useALListViewability).toBe(useALListViewability);
    expect(PluginBarrel.logDeepLinkOpen).toBe(logDeepLinkOpen);
    expect(PluginBarrel.logReactErrorBoundary).toBe(logReactErrorBoundary);
  });

  test('provides default conditional-loader exports without changing named exports', () => {
    expect(Runtime).toBe(AutoLogging);
    expect(Surfaces.reactNativeSurfaces).toBe(reactNativeSurfaces);
    expect(UIEvents.reactNativeUIEvents).toBe(reactNativeUIEvents);
    expect(Lifecycle.reactNativeAppLifecycle).toBe(reactNativeAppLifecycle);
    expect(AppLifecycle.reactNativeAppLifecycle).toBe(reactNativeAppLifecycle);
    expect(AppStateEvents.reactNativeAppStateEvents).toBe(
      reactNativeAppStateEvents
    );
    expect(Heartbeat.reactNativeHeartbeat).toBe(reactNativeHeartbeat);
    expect(Screens.reactNativeScreens).toBe(reactNativeScreens);
    expect(ListImpressions.reactNativeListImpressions).toBe(
      reactNativeListImpressions
    );
    expect(DeepLinks.reactNativeDeepLinks).toBe(reactNativeDeepLinks);
    expect(ReactErrors.reactNativeReactErrors).toBe(reactNativeReactErrors);
    expect(Transport.getMobileEventContext).toBe(
      PluginBarrel.getMobileEventContext
    );
  });

  test('retains the strict Channel constructor and resilient factory', () => {
    expect(Root.Channel).toBe(Channel);
    expect(Root.Hook).toBe(Hook);
    expect(Root.PausableChannel).toBe(PausableChannel);
    expect(Root.PipeableEmitter).toBe(PipeableEmitter);
    expect(Root.ResilientChannel).toBe(ResilientChannel);

    const legacyChannel = new Channel<ALReactNativeEventMap>();
    const legacyEvents: string[] = [];
    legacyChannel.addListener('al_ui_event', (event) =>
      legacyEvents.push(event.event)
    );
    legacyChannel.emit('al_ui_event', {
      event: 'click',
      eventIndex: 0,
      eventTimestamp: 1,
      metadata: {},
      sourceProp: 'onPress',
    });
    expect(legacyEvents).toEqual(['click']);

    const errors: unknown[] = [];
    const modernChannel = createAutoLoggingChannel<ALReactNativeEventMap>(
      (error) => errors.push(error)
    );
    const modernEvents: string[] = [];
    modernChannel.addListener('al_ui_event', () => {
      throw new Error('subscriber failure');
    });
    modernChannel.addListener('al_ui_event', (event) =>
      modernEvents.push(event.event)
    );
    expect(() =>
      modernChannel.emit('al_ui_event', {
        event: 'click',
        eventIndex: 0,
        eventTimestamp: 1,
        metadata: {},
        sourceProp: 'onPress',
      })
    ).not.toThrow();
    expect(errors).toHaveLength(1);
    expect(modernEvents).toEqual(['click']);
  });

  test('composes capability entries through the shared runtime singleton', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const transitions: string[] = [];
    channel.addListener('al_screen_transition_event', (event) => {
      transitions.push(event.screen);
    });

    expect(
      AutoLogging.init({
        channel,
        plugins: [reactNativeScreens()],
      })
    ).toBe(true);
    expect(setCurrentScreen('plugin-entry-screen')).toBe(true);
    expect(transitions).toEqual(['plugin-entry-screen']);
  });
});
