/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React, { StrictMode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import * as AutoLogging from '../src/AutoLogging';
import {
  ALSurface,
  ALSurfaceData,
  reactNativeSurfaces,
  resetALSurfaceDataForTests,
  useSurface,
  type ALSurfaceDataNode,
} from '../src/ALSurface';
import type {
  ALReactNativeEventMap,
  ALSurfaceMutationEventData,
} from '../src/ALTypes';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('React Native surfaces plugin', () => {
  const runtimeGlobal = globalThis as typeof globalThis & {
    __DEV__?: boolean;
  };
  const previousDev = runtimeGlobal.__DEV__;

  beforeAll(() => {
    runtimeGlobal.__DEV__ = true;
  });

  afterAll(() => {
    runtimeGlobal.__DEV__ = previousDev;
  });

  afterEach(async () => {
    AutoLogging.dispose();
    await act(async () => Promise.resolve());
    resetALSurfaceDataForTests();
  });

  test('registers only committed hierarchy and emits linked lifecycle events', async () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALSurfaceMutationEventData[] = [];
    channel.addListener('al_surface_mutation_event', (event) =>
      events.push(event)
    );
    AutoLogging.init({ channel, plugins: [reactNativeSurfaces()] });
    ALSurfaceData.root.setInheritedPropery('fixture-owner', 'root-value');
    let captured: ALSurfaceDataNode | null = null;

    function Probe() {
      captured = useSurface();
      return null;
    }

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          StrictMode,
          null,
          React.createElement(
            ALSurface,
            {
              name: 'dashboard',
              metadata: {
                root_marker: 'root',
                numeric_marker: 2,
                non_finite_marker: Number.POSITIVE_INFINITY,
                ignored_nested: { private: true } as never,
              },
            },
            React.createElement(
              ALSurface,
              {
                name: 'container',
                nonInteractive: true,
                metadata: { lifecycle_only: true },
              },
              React.createElement(
                ALSurface,
                {
                  name: 'actions',
                  metadata: { child_marker: 'child' },
                  uiEventMetadata: { click: { action: 'save' } },
                },
                React.createElement(Probe)
              )
            )
          )
        )
      );
      await Promise.resolve();
    });

    expect(captured).not.toBeNull();
    const data = captured as unknown as ALSurfaceDataNode;
    expect(data.nonInteractiveSurface).toBe('dashboard/container/actions');
    expect(data.surface).toBe('dashboard/actions');
    expect(data.metadata).toEqual({
      root_marker: 'root',
      numeric_marker: 2,
      non_finite_marker: Number.POSITIVE_INFINITY,
      lifecycle_only: true,
      child_marker: 'child',
    });
    expect(data.interactiveMetadata).toEqual({
      root_marker: 'root',
      numeric_marker: 2,
      non_finite_marker: Number.POSITIVE_INFINITY,
      child_marker: 'child',
    });
    expect(data.getInheriteUIEventMetadata('click')).toEqual({
      action: 'save',
    });
    expect(data.getInheritedPropery('fixture-owner')).toBe('root-value');
    expect(data.parent.getChild('actions')).toBe(data);
    expect(ALSurfaceData.get('dashboard/actions')).toBe(data);
    expect(ALSurfaceData.tryGet('dashboard/container/actions')).toBe(data);
    expect(data.getElements()).toBe(data.getElements());
    expect(Object.isFrozen(data.getElements())).toBe(true);
    expect(() => JSON.stringify(data)).not.toThrow();

    const mounts = events.filter((event) => event.event === 'mount_component');
    expect(mounts).toHaveLength(3);
    expect(mounts.map((event) => event.eventIndex)).toEqual([0, 1, 2]);
    expect(mounts.every((event) => !('element' in event))).toBe(true);

    if (renderer == null) throw new Error('Expected a mounted renderer.');
    const mountedRenderer = renderer;
    await act(async () => {
      mountedRenderer.unmount();
      await Promise.resolve();
    });
    expect(ALSurfaceData.tryGet('dashboard/actions')).toBeUndefined();
    const unmounts = events.filter(
      (event) => event.event === 'unmount_component'
    );
    expect(unmounts).toHaveLength(3);
    for (const event of unmounts) {
      const mount = mounts.find(
        (candidate) => candidate.surfacePath === event.surfacePath
      );
      expect(event.relatedEventIndex).toBe(mount?.eventIndex);
    }
  });

  test('keeps hierarchy available while mutation publishing is disabled', async () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const listener = jest.fn();
    channel.addListener('al_surface_mutation_event', listener);
    AutoLogging.init({
      channel,
      plugins: [reactNativeSurfaces({ publishMutations: false })],
    });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(ALSurface, { name: 'silent' }, 'content')
      );
      await Promise.resolve();
    });
    expect(ALSurfaceData.get('silent').surfaceName).toBe('silent');
    expect(listener).not.toHaveBeenCalled();
    if (renderer == null) throw new Error('Expected a mounted renderer.');
    const mountedRenderer = renderer;
    await act(async () => {
      mountedRenderer.unmount();
      await Promise.resolve();
    });
    expect(listener).not.toHaveBeenCalled();
  });

  test('does not register surfaces when the plugin is absent', async () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    AutoLogging.init({ channel, plugins: [] });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(ALSurface, { name: 'inactive' }, 'content')
      );
      await Promise.resolve();
    });
    expect(ALSurfaceData.tryGet('inactive')).toBeUndefined();
    if (renderer == null) throw new Error('Expected a mounted renderer.');
    act(() => renderer.unmount());
  });

  test('preserves name-keyed replacement and duplicate warnings', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    AutoLogging.init({ channel, plugins: [reactNativeSurfaces()] });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(ALSurface, { name: 'duplicate' }, 'first'),
          React.createElement(ALSurface, { name: 'duplicate' }, 'second')
        )
      );
      await Promise.resolve();
    });
    expect(ALSurfaceData.root.getChildren()).toHaveLength(1);
    expect(consoleError).toHaveBeenCalledWith(
      'Duplicate AutoLogging surface name "duplicate" under "root".'
    );

    if (renderer == null) throw new Error('Expected a mounted renderer.');
    const mountedRenderer = renderer;
    await act(async () => {
      mountedRenderer.unmount();
      await Promise.resolve();
    });
    consoleError.mockRestore();
  });
});
