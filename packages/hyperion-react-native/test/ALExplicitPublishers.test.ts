/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { addChannelSubscriber } from '../src/ALChannel';
import { logDeepLinkOpen } from '../src/ALDeepLink';
import {
  useALListViewability,
  type ALListViewabilityResult,
  type ALViewabilityInfo,
} from '../src/ALListViewability';
import {
  initializeAutoLogging,
  resetALRuntimeForTests,
} from '../src/ALRuntime';
import {
  logReactErrorBoundary,
  type ALReactErrorInfo,
} from '../src/ALReactError';
import { setCurrentScreen } from '../src/ALScreen';
import { resetSessionForTests } from '../src/ALSession';
import type {
  ALDeepLinkEventData,
  ALListImpressionEventData,
  ALReactErrorEventData,
} from '../src/ALTypes';

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: () => undefined }),
  },
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

describe('explicit mobile publishers', () => {
  beforeEach(() => {
    resetSessionForTests();
  });

  afterEach(() => {
    resetALRuntimeForTests();
  });

  it('publishes raw deep-link targets for subscriber-owned policy', () => {
    const events: ALDeepLinkEventData[] = [];
    addChannelSubscriber('al_deep_link_event', () => {
      throw new Error('product subscriber failure');
    });
    addChannelSubscriber('al_deep_link_event', (event) => events.push(event));
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });

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

  it('deduplicates list impressions without publishing keys or items', () => {
    const events: ALListImpressionEventData[] = [];
    const productCallback = jest.fn();
    addChannelSubscriber('al_list_impression_event', () => {
      throw new Error('product subscriber failure');
    });
    addChannelSubscriber('al_list_impression_event', (event) =>
      events.push(event)
    );
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    let result: ALListViewabilityResult<{ name: string; privateValue: string }>;
    function Harness() {
      result = useALListViewability({
        listName: 'settings_rows',
        getItemName: (item) => item.name,
        onViewableItemsChanged: productCallback,
      });
      return null;
    }
    act(() => {
      TestRenderer.create(React.createElement(Harness));
    });
    expect(result!.viewabilityConfig).toEqual({
      minimumViewTime: 500,
      itemVisiblePercentThreshold: 50,
    });
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
    result!.onViewableItemsChanged(info);
    result!.onViewableItemsChanged(info);

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
    result!.onViewableItemsChanged(info);
    expect(events).toHaveLength(2);
  });

  it('bounds list dedupe memory with oldest-key eviction', () => {
    const events: ALListImpressionEventData[] = [];
    addChannelSubscriber('al_list_impression_event', (event) =>
      events.push(event)
    );
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    let result: ALListViewabilityResult<number>;
    function Harness() {
      result = useALListViewability({ listName: 'large_list' });
      return null;
    }
    act(() => {
      TestRenderer.create(React.createElement(Harness));
    });
    for (let index = 0; index <= 2_000; index++) {
      result!.onViewableItemsChanged({
        viewableItems: [],
        changed: [{ item: index, key: String(index), index, isViewable: true }],
      });
    }
    result!.onViewableItemsChanged({
      viewableItems: [],
      changed: [{ item: 0, key: '0', index: 0, isViewable: true }],
    });
    expect(events).toHaveLength(2_002);
  });

  it('publishes raw React boundary input for subscriber-owned policy', () => {
    const events: ALReactErrorEventData[] = [];
    addChannelSubscriber('al_react_error_event', (event) => events.push(event));
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

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

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(Boundary, null, React.createElement(Thrower))
      );
    });
    expect(renderer!.toJSON()).toBe('fallback-owned-by-app');
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
    const serialized = JSON.stringify(events[0]);
    expect(serialized).toContain('private message');
    expect(serialized).toContain('/private/source');
    expect(events[0].reactComponentStack).toContain('Thrower');
    consoleError.mockRestore();
  });
});
