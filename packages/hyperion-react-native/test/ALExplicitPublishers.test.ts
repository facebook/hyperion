/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import { logDeepLinkOpen, reactNativeDeepLinks } from '../src/ALDeepLink';
import {
  MAX_DEDUPED_ITEMS_PER_SCREEN,
  reactNativeListImpressions,
  useALListViewability,
  type ALListViewabilityResult,
  type ALViewabilityInfo,
} from '../src/ALListViewability';
import {
  logReactErrorBoundary,
  reactNativeReactErrors,
  type ALReactErrorInfo,
} from '../src/ALReactError';
import { reactNativeScreens, setCurrentScreen } from '../src/ALScreen';
import { ALSurface, reactNativeSurfaces } from '../src/ALSurface';
import type {
  ALDeepLinkEventData,
  ALListImpressionEventData,
  ALReactErrorEventData,
  ALReactNativeEventMap,
} from '../src/ALTypes';
import * as AutoLogging from '../src/AutoLogging';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('explicit React Native publisher plugins', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (String(args[0]).includes('react-test-renderer is deprecated')) return;
      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    AutoLogging.dispose();
    jest.restoreAllMocks();
  });

  test('publishes raw deep-link targets for subscriber-owned policy', () => {
    const errors: unknown[] = [];
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>((error) =>
      errors.push(error)
    );
    const events: ALDeepLinkEventData[] = [];
    channel.addListener('al_deep_link_event', () => {
      throw new Error('product subscriber failure');
    });
    channel.addListener('al_deep_link_event', (event) => events.push(event));
    AutoLogging.init({ channel, plugins: [reactNativeDeepLinks()] });

    expect(
      logDeepLinkOpen('sample://settings/profile', {
        source: 'url_event',
        metadata: { campaign_name: 'settings' },
      })
    ).toBe(true);
    expect(
      logDeepLinkOpen('sample://settings/profile?token=private', {
        source: 'url_event',
      })
    ).toBe(true);
    expect(
      logDeepLinkOpen('sample://settings/%70rivate', {
        source: 'notification',
      })
    ).toBe(true);
    expect(logDeepLinkOpen('', { source: 'initial_url' })).toBe(false);
    expect(
      logDeepLinkOpen('sample://invalid', { source: 'invalid' as never })
    ).toBe(false);

    expect(errors).toHaveLength(3);
    expect(events.map((event) => event.eventIndex)).toEqual([0, 1, 2]);
    expect(events).toEqual([
      expect.objectContaining({
        event: 'deep_link_open',
        source: 'url_event',
        targetURI: 'sample://settings/profile',
        metadata: { campaign_name: 'settings' },
      }),
      expect.objectContaining({
        targetURI: 'sample://settings/profile?token=private',
      }),
      expect.objectContaining({
        targetURI: 'sample://settings/%70rivate',
      }),
    ]);
  });

  test('deduplicates list impressions without publishing keys or items', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALListImpressionEventData[] = [];
    const productCallback = jest.fn();
    channel.addListener('al_list_impression_event', (event) =>
      events.push(event)
    );
    AutoLogging.init({
      channel,
      plugins: [reactNativeListImpressions(), reactNativeScreens()],
    });
    let result:
      | ALListViewabilityResult<{ name: string; privateValue: string }>
      | undefined;
    function Harness() {
      result = useALListViewability({
        listName: 'settings_rows',
        getItemName: (item) => item.name,
        onViewableItemsChanged: productCallback,
      });
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(Harness));
    });
    if (result == null || renderer == null) {
      throw new Error('Expected a mounted list harness.');
    }
    const mountedResult = result;
    const info: ALViewabilityInfo<{
      name: string;
      privateValue: string;
    }> = {
      viewableItems: [],
      changed: [
        {
          item: { name: 'profile', privateValue: 'never publish' },
          key: 'private-key',
          index: 2,
          isViewable: true,
        },
      ],
    };

    expect(mountedResult.viewabilityConfig).toEqual({
      minimumViewTime: 500,
      itemVisiblePercentThreshold: 50,
    });
    mountedResult.onViewableItemsChanged(info);
    mountedResult.onViewableItemsChanged(info);
    expect(productCallback).toHaveBeenCalledTimes(2);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        event: 'list_item_visible',
        listName: 'settings_rows',
        itemName: 'profile',
        itemIndex: 2,
      })
    );
    expect(JSON.stringify(events[0])).not.toContain('private-key');
    expect(JSON.stringify(events[0])).not.toContain('never publish');

    setCurrentScreen('OtherScreen');
    mountedResult.onViewableItemsChanged(info);
    expect(events).toHaveLength(2);
    act(() => renderer.unmount());
  });

  test('captures committed surface data and latest list callback', async () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALListImpressionEventData[] = [];
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();
    channel.addListener('al_list_impression_event', (event) =>
      events.push(event)
    );
    AutoLogging.init({
      channel,
      plugins: [reactNativeSurfaces(), reactNativeListImpressions()],
    });
    let result: ALListViewabilityResult<string> | undefined;
    function Harness({ callback }: { callback(): void }) {
      result = useALListViewability({
        listName: 'surface-list',
        metadata: { source: 'fixture' },
        onViewableItemsChanged: callback,
      });
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          ALSurface,
          { name: 'list-surface', metadata: { owner: 'surface' } },
          React.createElement(Harness, { callback: firstCallback })
        )
      );
      await Promise.resolve();
    });
    if (renderer == null || result == null) {
      throw new Error('Expected a mounted list harness.');
    }
    const stableHandler = result.onViewableItemsChanged;
    act(() => {
      renderer?.update(
        React.createElement(
          ALSurface,
          { name: 'list-surface', metadata: { owner: 'surface' } },
          React.createElement(Harness, { callback: secondCallback })
        )
      );
    });
    expect(result?.onViewableItemsChanged).toBe(stableHandler);
    stableHandler({
      viewableItems: [],
      changed: [{ item: 'row', key: 'row', index: 0, isViewable: true }],
    });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        metadata: { source: 'fixture' },
        surface: 'list-surface',
        surfaceMetadata: { owner: 'surface' },
      })
    );
    act(() => renderer?.unmount());
    await act(async () => Promise.resolve());
  });

  test('bounds list dedupe memory with oldest-key eviction', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALListImpressionEventData[] = [];
    channel.addListener('al_list_impression_event', (event) =>
      events.push(event)
    );
    AutoLogging.init({ channel, plugins: [reactNativeListImpressions()] });
    let result: ALListViewabilityResult<number> | undefined;
    function Harness() {
      result = useALListViewability({ listName: 'large_list' });
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(Harness));
    });
    if (result == null || renderer == null) {
      throw new Error('Expected a mounted list harness.');
    }
    const mountedResult = result;
    for (let index = 0; index <= MAX_DEDUPED_ITEMS_PER_SCREEN; index++) {
      mountedResult.onViewableItemsChanged({
        viewableItems: [],
        changed: [{ item: index, key: String(index), index, isViewable: true }],
      });
    }
    mountedResult.onViewableItemsChanged({
      viewableItems: [],
      changed: [{ item: 0, key: '0', index: 0, isViewable: true }],
    });
    expect(events).toHaveLength(MAX_DEDUPED_ITEMS_PER_SCREEN + 2);
    act(() => renderer.unmount());
  });

  test('publishes before preserving a throwing list callback', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALListImpressionEventData[] = [];
    const callbackError = new Error('application callback failed');
    channel.addListener('al_list_impression_event', (event) =>
      events.push(event)
    );
    AutoLogging.init({ channel, plugins: [reactNativeListImpressions()] });
    let result: ALListViewabilityResult<string> | undefined;
    function Harness() {
      result = useALListViewability({
        listName: 'throwing-list',
        onViewableItemsChanged() {
          throw callbackError;
        },
      });
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(Harness));
    });
    if (result == null || renderer == null) {
      throw new Error('Expected a mounted list harness.');
    }

    expect(() =>
      result?.onViewableItemsChanged({
        viewableItems: [],
        changed: [{ item: 'row', key: 'row', index: 0, isViewable: true }],
      })
    ).toThrow(callbackError);
    expect(events).toHaveLength(1);
    act(() => renderer.unmount());
  });

  test('publishes real React error-boundary input without redaction', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALReactErrorEventData[] = [];
    channel.addListener('al_react_error_event', (event) => events.push(event));
    AutoLogging.init({ channel, plugins: [reactNativeReactErrors()] });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    class Boundary extends React.Component<
      { children: React.ReactNode },
      { failed: boolean }
    > {
      state = { failed: false };

      static getDerivedStateFromError() {
        return { failed: true };
      }

      componentDidCatch(error: Error, info: React.ErrorInfo) {
        logReactErrorBoundary(error, info as ALReactErrorInfo, {
          boundaryName: 'SettingsBoundary',
          errorCategory: 'render_failure',
        });
      }

      render() {
        return this.state.failed
          ? 'fallback-owned-by-app'
          : this.props.children;
      }
    }
    function Thrower(): React.ReactNode {
      throw new TypeError('private message /private/source.tsx');
    }

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(Boundary, null, React.createElement(Thrower))
      );
    });
    if (renderer == null) throw new Error('Expected a mounted renderer.');
    expect(renderer.toJSON()).toBe('fallback-owned-by-app');
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        event: 'error',
        source: 'react_error_boundary',
        errorName: 'TypeError',
        errorMessage: 'private message /private/source.tsx',
        boundaryName: 'SettingsBoundary',
        errorCategory: 'render_failure',
      })
    );
    expect(events[0].reactComponentStack).toContain('Thrower');
  });

  test('keeps absent publisher families inactive while callbacks still run', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const deepLinks = jest.fn();
    const lists = jest.fn();
    const errors = jest.fn();
    const productCallback = jest.fn();
    channel.addListener('al_deep_link_event', deepLinks);
    channel.addListener('al_list_impression_event', lists);
    channel.addListener('al_react_error_event', errors);
    AutoLogging.init({ channel, plugins: [] });
    let result: ALListViewabilityResult<string> | undefined;
    function Harness() {
      result = useALListViewability({
        listName: 'disabled_list',
        onViewableItemsChanged: productCallback,
      });
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(React.createElement(Harness));
    });
    if (result == null || renderer == null) {
      throw new Error('Expected a mounted list harness.');
    }

    expect(logDeepLinkOpen('sample://disabled', { source: 'url_event' })).toBe(
      false
    );
    expect(logReactErrorBoundary(new Error('disabled'), {})).toBe(false);
    result.onViewableItemsChanged({
      viewableItems: [],
      changed: [{ item: 'item', key: 'item', index: 0, isViewable: true }],
    });

    expect(productCallback).toHaveBeenCalledTimes(1);
    expect(deepLinks).not.toHaveBeenCalled();
    expect(lists).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });
});
