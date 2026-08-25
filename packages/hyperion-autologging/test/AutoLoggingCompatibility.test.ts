/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

'use strict';

import { Channel } from 'hyperion-channel/src/Channel';
import type { ALChannelEvent, InitOptions } from '../src/AutoLogging';

interface RecordedCall {
  name: string;
  args: unknown[];
}

interface LoadedAutoLogging {
  AutoLogging: {
    init(options: InitOptions): boolean;
    getInitOptions(): InitOptions;
  };
  calls: RecordedCall[];
}

async function loadAutoLogging(
  globalValue: unknown = window,
  throwOn?: string
): Promise<LoadedAutoLogging> {
  jest.resetModules();
  const calls: RecordedCall[] = [];
  const record =
    (name: string) =>
    (...args: unknown[]): void => {
      calls.push({ name, args });
      if (name === throwOn) {
        throw new Error(`${name} failed`);
      }
    };

  jest.doMock('hyperion-flowlet/src/FlowletWrappers', () => ({
    initFlowletTrackers: record('flowlet-trackers'),
  }));
  jest.doMock('hyperion-globals/src/global', () => ({
    __esModule: true,
    default: globalValue,
  }));
  jest.doMock('hyperion-react/src/IReactComponent', () => ({
    init: record('react'),
  }));
  jest.doMock('../src/ALDOMSnaptshotPublisher', () => ({
    publish: record('dom-snapshot'),
  }));
  jest.doMock('../src/ALElementValuePublisher', () => ({
    publish: record('element-value'),
  }));
  jest.doMock('../src/ALFlowletManager', () => ({
    ALFlowletManagerInstance: {},
  }));
  jest.doMock('../src/ALFlowletPublisher', () => ({
    publish: record('flowlet-publisher'),
  }));
  jest.doMock('../src/ALHeartbeat', () => ({
    start: record('heartbeat'),
  }));
  jest.doMock('../src/ALHoverPublisher', () => ({
    publish: record('hover'),
  }));
  jest.doMock('../src/ALInteractableDOMElement', () => ({
    init: record('element-text'),
  }));
  jest.doMock('../src/ALNetworkPublisher', () => ({
    publish: record('network'),
  }));
  jest.doMock('../src/ALReactUtils', () => ({
    setComponentNameValidator: record('component-name-validator'),
  }));
  jest.doMock('../src/ALSessionFlowID', () => ({
    init: record('session'),
  }));
  jest.doMock('../src/ALSurface', () => ({
    init: record('surface'),
  }));
  jest.doMock('../src/ALSurfaceMutationPublisher', () => ({
    publish: record('surface-mutation'),
  }));
  jest.doMock('../src/ALSurfaceProxy', () => ({
    init: record('surface-proxy'),
  }));
  jest.doMock('../src/ALSurfaceVisibilityPublisher', () => ({
    publish: record('surface-visibility'),
  }));
  jest.doMock('../src/ALTriggerFlowlet', () => ({
    init: record('trigger-flowlet'),
  }));
  jest.doMock('../src/ALUIEventPublisher', () => ({
    publish: record('ui'),
  }));

  return {
    AutoLogging: await import('../src/AutoLogging'),
    calls,
  };
}

function createOptions(
  channel: Channel<ALChannelEvent>,
  overrides: Partial<InitOptions> = {}
): InitOptions {
  return {
    channel,
    react: {},
    surface: {},
    ...overrides,
  } as InitOptions;
}

function getCall(calls: RecordedCall[], name: string): RecordedCall {
  const call = calls.find((candidate) => candidate.name === name);
  expect(call).toBeDefined();
  return call as RecordedCall;
}

describe('web AutoLogging compatibility contract', () => {
  it('preserves plugin precedence and built-in initialization order', async () => {
    const { AutoLogging, calls } = await loadAutoLogging();
    const applicationChannel = new Channel<ALChannelEvent>();
    const eventOrder: string[] = [];
    let pluginChannel: Channel<ALChannelEvent> | null = null;
    const componentNameValidator = () => true;
    const options = createOptions(applicationChannel, {
      componentNameValidator,
      elementText: {},
      flowletPublisher: {},
      heartbeat: {},
      network: {},
      sessionFlowID: { domain: 'example.com' },
      surfaceMutationPublisher: {},
      surfaceVisibilityPublisher: {},
      triggerFlowlet: {
        enableReactMethodFlowlet: true,
        enableReactSetStateTracking: false,
      },
      uiEventPublisher: { uiEvents: [] },
      domSnapshotPublisher: {},
      plugins: [
        (channel) => {
          calls.push({ name: 'custom-plugin', args: [channel] });
          pluginChannel = channel;
          channel.addListener('al_custom_event', () => {
            eventOrder.push('plugin');
          });
        },
      ],
    });
    applicationChannel.addListener('al_custom_event', () => {
      eventOrder.push('application');
    });

    expect(AutoLogging.init(options)).toBe(true);
    expect(calls.map((call) => call.name)).toEqual([
      'custom-plugin',
      'component-name-validator',
      'flowlet-trackers',
      'trigger-flowlet',
      'react',
      'session',
      'element-text',
      'flowlet-publisher',
      'surface-mutation',
      'surface-visibility',
      'ui',
      'hover',
      'element-value',
      'heartbeat',
      'network',
      'dom-snapshot',
      'surface',
      'surface-proxy',
    ]);

    expect(pluginChannel).not.toBe(applicationChannel);
    const publisherNames = [
      'trigger-flowlet',
      'session',
      'flowlet-publisher',
      'surface-mutation',
      'surface-visibility',
      'ui',
      'hover',
      'element-value',
      'heartbeat',
      'network',
      'dom-snapshot',
      'surface',
    ];
    for (const name of publisherNames) {
      expect(
        (getCall(calls, name).args[0] as { channel: unknown }).channel
      ).toBe(pluginChannel);
    }

    expect(options.react.enableInterceptClassComponentConstructor).toBe(true);
    expect(options.react.enableInterceptClassComponentMethods).toBe(true);
    expect(options.react.enableInterceptFunctionComponentRender).toBe(true);
    expect(AutoLogging.getInitOptions()).toBe(options);

    pluginChannel?.emit('al_custom_event', {} as never);
    expect(eventOrder).toEqual(['plugin', 'application']);

    const callCount = calls.length;
    expect(AutoLogging.init(options)).toBe(false);
    expect(calls).toHaveLength(callCount);
  });

  it('uses the application channel when plugins are omitted', async () => {
    const { AutoLogging, calls } = await loadAutoLogging();
    const applicationChannel = new Channel<ALChannelEvent>();

    expect(AutoLogging.init(createOptions(applicationChannel))).toBe(true);

    expect(
      (getCall(calls, 'surface').args[0] as { channel: unknown }).channel
    ).toBe(applicationChannel);
  });

  it('creates and pipes an internal channel for an empty plugin list', async () => {
    const { AutoLogging, calls } = await loadAutoLogging();
    const applicationChannel = new Channel<ALChannelEvent>();
    const applicationListener = jest.fn();
    applicationChannel.addListener('al_custom_event', applicationListener);

    expect(
      AutoLogging.init(createOptions(applicationChannel, { plugins: [] }))
    ).toBe(true);

    const internalChannel = (
      getCall(calls, 'surface').args[0] as {
        channel: Channel<ALChannelEvent>;
      }
    ).channel;
    expect(internalChannel).not.toBe(applicationChannel);
    internalChannel.emit('al_custom_event', {} as never);
    expect(applicationListener).toHaveBeenCalledTimes(1);
  });

  it('retains strict listener failures before downstream piping', async () => {
    const { AutoLogging } = await loadAutoLogging();
    const applicationChannel = new Channel<ALChannelEvent>();
    const laterPluginListener = jest.fn();
    const applicationListener = jest.fn();
    let pluginChannel: Channel<ALChannelEvent> | null = null;
    applicationChannel.addListener('al_custom_event', applicationListener);

    AutoLogging.init(
      createOptions(applicationChannel, {
        plugins: [
          (channel) => {
            pluginChannel = channel;
            channel.addListener('al_custom_event', () => {
              throw new Error('listener failed');
            });
            channel.addListener('al_custom_event', laterPluginListener);
          },
        ],
      })
    );

    expect(() => {
      pluginChannel?.emit('al_custom_event', {} as never);
    }).toThrow('listener failed');
    expect(laterPluginListener).not.toHaveBeenCalled();
    expect(applicationListener).not.toHaveBeenCalled();
  });

  it('keeps failed plugin initialization sticky and stops later work', async () => {
    const { AutoLogging, calls } = await loadAutoLogging();
    const applicationChannel = new Channel<ALChannelEvent>();
    const laterPlugin = jest.fn();
    const options = createOptions(applicationChannel, {
      plugins: [
        () => {
          calls.push({ name: 'failing-plugin', args: [] });
          throw new Error('plugin failed');
        },
        laterPlugin,
      ],
    });

    expect(() => AutoLogging.init(options)).toThrow('plugin failed');
    expect(laterPlugin).not.toHaveBeenCalled();
    expect(calls.map((call) => call.name)).toEqual(['failing-plugin']);
    expect(AutoLogging.getInitOptions()).toBe(options);
    expect(AutoLogging.init(createOptions(applicationChannel))).toBe(false);
  });

  it('evaluates built-in option gates after custom plugins run', async () => {
    const { AutoLogging, calls } = await loadAutoLogging();
    const applicationChannel = new Channel<ALChannelEvent>();
    const options = createOptions(applicationChannel, {
      plugins: [
        () => {
          options.network = {};
        },
      ],
    });

    expect(AutoLogging.init(options)).toBe(true);
    expect(calls.some((call) => call.name === 'network')).toBe(true);
  });

  it('preserves sticky partial initialization when a built-in throws', async () => {
    const { AutoLogging, calls } = await loadAutoLogging(
      window,
      'surface-mutation'
    );
    const applicationChannel = new Channel<ALChannelEvent>();
    const options = createOptions(applicationChannel, {
      surfaceMutationPublisher: {},
      surfaceVisibilityPublisher: {},
    });

    expect(() => AutoLogging.init(options)).toThrow('surface-mutation failed');
    expect(calls.map((call) => call.name)).toEqual([
      'flowlet-trackers',
      'surface-mutation',
    ]);
    expect(AutoLogging.getInitOptions()).toBe(options);
    expect(AutoLogging.init(createOptions(applicationChannel))).toBe(false);
  });

  it('preserves explicit false React interception flags', async () => {
    const { AutoLogging, calls } = await loadAutoLogging();
    const applicationChannel = new Channel<ALChannelEvent>();
    const react = {
      enableInterceptClassComponentConstructor: false,
      enableInterceptClassComponentMethods: false,
      enableInterceptFunctionComponentRender: false,
      enableInterceptDomElement: false,
    };

    AutoLogging.init(
      createOptions(applicationChannel, {
        react,
        enableReactComponentVisitors: false,
        triggerFlowlet: {
          enableReactMethodFlowlet: true,
          enableReactSetStateTracking: true,
        },
      })
    );

    expect(react).toEqual({
      enableInterceptClassComponentConstructor: false,
      enableInterceptClassComponentMethods: false,
      enableInterceptFunctionComponentRender: false,
      enableInterceptDomElement: false,
    });
    expect(calls.some((call) => call.name === 'react')).toBe(false);
  });

  it('skips DOM flowlet setup when no document is available', async () => {
    const { AutoLogging, calls } = await loadAutoLogging(null);
    const applicationChannel = new Channel<ALChannelEvent>();

    AutoLogging.init(
      createOptions(applicationChannel, {
        triggerFlowlet: {
          enableReactMethodFlowlet: true,
          enableReactSetStateTracking: false,
        },
      })
    );

    expect(calls.some((call) => call.name === 'flowlet-trackers')).toBe(false);
    expect(calls.some((call) => call.name === 'trigger-flowlet')).toBe(false);
    expect(calls.some((call) => call.name === 'react')).toBe(true);
  });
});
