/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import { createAutoLoggingChannel } from '../src/ALChannel';
import type { ALManagedPlugin } from '../src/ALPlugin';
import { ALPluginRuntime } from '../src/ALPluginRuntime';

interface TestEvents extends BaseChannelEventType {
  event: [value: string];
}

interface TestContext {
  readonly value: string;
}

function createPlugin(
  name: string,
  calls: string[],
  options: {
    dependencies?: readonly string[];
    install?: () => void;
    start?: () => void;
    dispose?: () => void;
  } = {}
): ALManagedPlugin<TestEvents, TestContext> {
  return {
    name,
    dependencies: options.dependencies,
    install(channel, context) {
      calls.push(`install:${name}:${context.value}`);
      options.install?.();
      const listener = channel.addListener('event', (value) => {
        calls.push(`event:${name}:${value}`);
      });
      return {
        start() {
          calls.push(`start:${name}`);
          options.start?.();
        },
        dispose() {
          channel.removeListener('event', listener);
          calls.push(`dispose:${name}`);
          options.dispose?.();
        },
      };
    },
  };
}

describe('ALPluginRuntime', () => {
  test('installs every plugin before starting event sources', () => {
    const calls: string[] = [];
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    const plugins = [
      createPlugin('first', calls),
      createPlugin('second', calls, { dependencies: ['first'] }),
    ];

    expect(runtime.getState()).toBe('idle');
    expect(runtime.initialize(plugins)).toBe(true);
    expect(runtime.isInitialized()).toBe(true);
    expect(calls).toEqual([
      'install:first:context',
      'install:second:context',
      'start:first',
      'start:second',
    ]);

    channel.emit('event', 'payload');
    expect(calls.slice(-2)).toEqual([
      'event:first:payload',
      'event:second:payload',
    ]);
    expect(runtime.initialize(plugins)).toBe(false);

    expect(runtime.dispose()).toBe(true);
    expect(calls.slice(-2)).toEqual(['dispose:second', 'dispose:first']);
    expect(runtime.getState()).toBe('idle');
    expect(runtime.dispose()).toBe(false);

    const callCount = calls.length;
    channel.emit('event', 'after-dispose');
    expect(calls).toHaveLength(callCount);
    expect(runtime.initialize(plugins)).toBe(true);
    expect(runtime.dispose()).toBe(true);
  });

  test('rejects reentrant initialization without disturbing the outer run', () => {
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    let nestedResult: boolean | undefined;
    const plugins: ALManagedPlugin<TestEvents, TestContext>[] = [
      {
        name: 'reentrant',
        install() {
          nestedResult = runtime.initialize(plugins);
        },
      },
    ];

    expect(runtime.initialize(plugins)).toBe(true);
    expect(nestedResult).toBe(false);
    expect(runtime.isInitialized()).toBe(true);
  });

  test('guards against reentrant initialization during validation', () => {
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    let nestedResult: boolean | undefined;
    const plugin: ALManagedPlugin<TestEvents, TestContext> = {
      get name() {
        nestedResult = runtime.initialize([]);
        return 'reentrant-validation';
      },
      install() {
        return undefined;
      },
    };

    expect(runtime.initialize([plugin])).toBe(true);
    expect(nestedResult).toBe(false);
    expect(runtime.isInitialized()).toBe(true);
  });

  test.each([
    {
      name: 'empty names',
      plugins: [{ name: ' ' }],
      message: 'AutoLogging plugins must have a non-empty name.',
    },
    {
      name: 'duplicate names',
      plugins: [{ name: 'duplicate' }, { name: 'duplicate' }],
      message: 'Duplicate AutoLogging plugin "duplicate".',
    },
    {
      name: 'missing dependencies',
      plugins: [{ name: 'plugin', dependencies: ['missing'] }],
      message: 'AutoLogging plugin "plugin" requires missing plugin "missing".',
    },
    {
      name: 'out-of-order dependencies',
      plugins: [{ name: 'second', dependencies: ['first'] }, { name: 'first' }],
      message:
        'AutoLogging plugin "second" requires "first" to be installed first.',
    },
  ])('validates $name before installation', ({ plugins, message }) => {
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    const install = jest.fn();
    const configuredPlugins = plugins.map((plugin) => ({
      ...plugin,
      install,
    }));

    expect(() => runtime.initialize(configuredPlugins)).toThrow(message);
    expect(install).not.toHaveBeenCalled();
    expect(runtime.getState()).toBe('idle');
  });

  test('rolls back installation failures and permits retry', () => {
    const calls: string[] = [];
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    const failure = new Error('install failure');
    const failingPlugins = [
      createPlugin('first', calls),
      createPlugin('second', calls, {
        install() {
          throw failure;
        },
      }),
    ];

    expect(() => runtime.initialize(failingPlugins)).toThrow(failure);
    expect(calls).toEqual([
      'install:first:context',
      'install:second:context',
      'dispose:first',
    ]);
    expect(runtime.getState()).toBe('idle');

    calls.length = 0;
    expect(runtime.initialize([createPlugin('retry', calls)])).toBe(true);
    expect(calls).toEqual(['install:retry:context', 'start:retry']);
    channel.emit('event', 'after-retry');
    expect(calls.slice(-1)).toEqual(['event:retry:after-retry']);
  });

  test('snapshots the configured plugin list before installation', () => {
    const calls: string[] = [];
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    const appended = createPlugin('appended', calls);
    const plugins: ALManagedPlugin<TestEvents, TestContext>[] = [];
    plugins.push(
      createPlugin('first', calls, {
        install() {
          plugins.push(appended);
        },
      })
    );

    expect(runtime.initialize(plugins)).toBe(true);
    expect(calls).toEqual(['install:first:context', 'start:first']);
  });

  test('rolls back start failures in reverse installation order', () => {
    const calls: string[] = [];
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    const failure = new Error('start failure');
    const plugins = [
      createPlugin('first', calls),
      createPlugin('second', calls, {
        start() {
          throw failure;
        },
      }),
      createPlugin('third', calls),
    ];

    expect(() => runtime.initialize(plugins)).toThrow(failure);
    expect(calls).toEqual([
      'install:first:context',
      'install:second:context',
      'install:third:context',
      'start:first',
      'start:second',
      'dispose:third',
      'dispose:second',
      'dispose:first',
    ]);
    expect(runtime.getState()).toBe('idle');
  });

  test('continues cleanup and rethrows the first disposal error', () => {
    const calls: string[] = [];
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    const firstError = new Error('third disposal failure');
    runtime.initialize([
      createPlugin('first', calls, {
        dispose() {
          throw new Error('first disposal failure');
        },
      }),
      createPlugin('second', calls),
      createPlugin('third', calls, {
        dispose() {
          throw firstError;
        },
      }),
    ]);
    calls.length = 0;

    expect(() => runtime.dispose()).toThrow(firstError);
    expect(calls).toEqual(['dispose:third', 'dispose:second', 'dispose:first']);
    expect(runtime.getState()).toBe('idle');
  });

  test('preserves an initialization error when rollback cleanup also fails', () => {
    const calls: string[] = [];
    const channel = createAutoLoggingChannel<TestEvents>();
    const runtime = new ALPluginRuntime(channel, { value: 'context' });
    const failure = new Error('install failure');

    expect(() =>
      runtime.initialize([
        createPlugin('first', calls, {
          dispose() {
            throw new Error('rollback failure');
          },
        }),
        createPlugin('second', calls, {
          install() {
            throw failure;
          },
        }),
      ])
    ).toThrow(failure);
    expect(calls).toEqual([
      'install:first:context',
      'install:second:context',
      'dispose:first',
    ]);
    expect(runtime.getState()).toBe('idle');
  });
});
