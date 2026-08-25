/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import type { AutoLoggingChannel } from './ALChannel';
import type { ALManagedPlugin, ALPluginLifecycle } from './ALPlugin';

export type ALPluginRuntimeState =
  | 'idle'
  | 'initializing'
  | 'initialized'
  | 'disposing';

export class ALPluginRuntime<EventMap extends BaseChannelEventType, Context> {
  private state: ALPluginRuntimeState = 'idle';
  private installedLifecycles: ALPluginLifecycle[] = [];

  constructor(
    private readonly channel: AutoLoggingChannel<EventMap>,
    private readonly context: Context
  ) {}

  getState(): ALPluginRuntimeState {
    return this.state;
  }

  isInitialized(): boolean {
    return this.state === 'initialized';
  }

  initialize(plugins: readonly ALManagedPlugin<EventMap, Context>[]): boolean {
    if (this.state !== 'idle') {
      return false;
    }

    this.state = 'initializing';
    const installedLifecycles: ALPluginLifecycle[] = [];

    try {
      const configuredPlugins = plugins.slice();
      validatePlugins(configuredPlugins);

      for (const plugin of configuredPlugins) {
        const lifecycle = plugin.install(this.channel, this.context);
        if (lifecycle) {
          installedLifecycles.push(lifecycle);
        }
      }

      for (const lifecycle of installedLifecycles) {
        lifecycle.start?.();
      }

      this.installedLifecycles = installedLifecycles;
      this.state = 'initialized';
      return true;
    } catch (error) {
      disposeLifecycles(installedLifecycles, false);
      this.state = 'idle';
      throw error;
    }
  }

  dispose(): boolean {
    if (this.state !== 'initialized') {
      return false;
    }

    this.state = 'disposing';
    const installedLifecycles = this.installedLifecycles;
    this.installedLifecycles = [];

    try {
      disposeLifecycles(installedLifecycles, true);
    } finally {
      this.state = 'idle';
    }
    return true;
  }
}

function validatePlugins<EventMap extends BaseChannelEventType, Context>(
  plugins: readonly ALManagedPlugin<EventMap, Context>[]
): void {
  const pluginNames = new Set<string>();
  for (const plugin of plugins) {
    const name = plugin.name;
    if (name.trim().length === 0) {
      throw new Error('AutoLogging plugins must have a non-empty name.');
    }
    if (pluginNames.has(name)) {
      throw new Error(`Duplicate AutoLogging plugin "${name}".`);
    }
    pluginNames.add(name);
  }

  const precedingPluginNames = new Set<string>();
  for (const plugin of plugins) {
    const dependencies = plugin.dependencies;
    if (dependencies) {
      for (const dependency of dependencies) {
        if (!pluginNames.has(dependency)) {
          throw new Error(
            `AutoLogging plugin "${plugin.name}" requires missing plugin "${dependency}".`
          );
        }
        if (!precedingPluginNames.has(dependency)) {
          throw new Error(
            `AutoLogging plugin "${plugin.name}" requires "${dependency}" to be installed first.`
          );
        }
      }
    }
    precedingPluginNames.add(plugin.name);
  }
}

function disposeLifecycles(
  lifecycles: readonly ALPluginLifecycle[],
  throwFirstError: boolean
): void {
  let firstError: unknown;
  let hasError = false;
  for (let i = lifecycles.length - 1; i >= 0; i--) {
    try {
      lifecycles[i].dispose?.();
    } catch (error) {
      if (!hasError) {
        firstError = error;
        hasError = true;
      }
    }
  }
  if (throwFirstError && hasError) {
    throw firstError;
  }
}
