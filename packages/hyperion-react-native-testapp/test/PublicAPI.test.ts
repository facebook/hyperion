/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

describe('public React Native package entries', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path');
  const resolve = (
    require as typeof require & {
      resolve(entry: string): string;
    }
  ).resolve;
  const resolveFrom = (
    require as unknown as {
      resolve(entry: string, options: { paths: readonly string[] }): string;
    }
  ).resolve;

  it.each([
    'hyperion-react-native',
    'hyperion-react-native/jsx-runtime',
    'hyperion-react-native/jsx-dev-runtime',
    'hyperion-react-native/channel',
    'hyperion-react-native/plugins',
    'hyperion-react-native/runtime',
    'hyperion-react-native/surfaces',
    'hyperion-react-native/ui-events',
    'hyperion-react-native/lifecycle',
    'hyperion-react-native/app-lifecycle',
    'hyperion-react-native/heartbeat',
    'hyperion-react-native/app-state-events',
    'hyperion-react-native/screens',
    'hyperion-react-native/list-impressions',
    'hyperion-react-native/deep-links',
    'hyperion-react-native/react-errors',
    'hyperion-react-native/transport',
    'hyperion-react-native/legacy-runtime-installer',
    'hyperion-react-native/babel-plugin-stable-event-props',
  ])('resolves %s', (entry) => {
    expect(resolve(entry)).toBeTruthy();
  });

  it('exposes plugin composition without library-owned policy', () => {
    const declarationPath = resolve('hyperion-react-native').replace(
      /index\.js$/,
      'index.d.ts'
    );
    const declaration = fs.readFileSync(declarationPath, 'utf8');
    expect(declaration).toContain('createAutoLoggingChannel');
    expect(declaration).toContain('reactNativeUIEvents');
    expect(declaration).toContain('reactNativeSurfaces');
    expect(declaration).not.toContain('ALProvider');
    expect(declaration).not.toContain('ALPrivacy');
    expect(declaration).not.toContain('sampleRate');
    expect(declaration).not.toContain('logAppEvent');
  });

  it('retains legacy Channel runtime exports', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const channel = require('hyperion-react-native/channel');
    expect(Object.keys(channel).sort()).toEqual([
      'Channel',
      'Hook',
      'PausableChannel',
      'PipeableEmitter',
      'ResilientChannel',
      'createAutoLoggingChannel',
    ]);
  });

  it('keeps the focused plugin entry free of legacy compatibility code', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const root = require('hyperion-react-native');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const plugins = require('hyperion-react-native/plugins');
    const pluginEntry = fs.readFileSync(
      resolve('hyperion-react-native/plugins'),
      'utf8'
    );

    expect(pluginEntry).not.toContain('ALCompatibility');
    expect(pluginEntry).not.toContain('ALLegacyAutoLogging');
    expect(root.AutoLogging.dispose).toBe(plugins.AutoLogging.dispose);
    expect(root.AutoLogging.isInitialized).toBe(
      plugins.AutoLogging.isInitialized
    );
  });

  it('resolves the application and package to one React copy', () => {
    const packageEntry = resolve('hyperion-react-native');
    const applicationReact = fs.realpathSync(resolve('react'));
    const packageReact = fs.realpathSync(
      resolveFrom('react', { paths: [path.dirname(packageEntry)] })
    );
    expect(packageReact).toBe(applicationReact);
  });

  it('exposes independently loadable capability entries', () => {
    const entries = [
      'runtime',
      'surfaces',
      'ui-events',
      'lifecycle',
      'app-lifecycle',
      'heartbeat',
      'app-state-events',
      'screens',
      'list-impressions',
      'deep-links',
      'react-errors',
      'transport',
    ];
    for (const entry of entries) {
      const source = fs.readFileSync(
        resolve(`hyperion-react-native/${entry}`),
        'utf8'
      );
      expect(source).not.toContain("from './index'");
      expect(source).not.toContain("from './plugins'");
    }
  });

  it('exposes defaults for downstream conditional module loaders', () => {
    const entries = [
      'runtime',
      'surfaces',
      'ui-events',
      'lifecycle',
      'app-lifecycle',
      'heartbeat',
      'app-state-events',
      'screens',
      'list-impressions',
      'deep-links',
      'react-errors',
      'transport',
    ];
    for (const entry of entries) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const loaded = require(`hyperion-react-native/${entry}`);
      expect(loaded.default).toBeDefined();
    }
  });

  it('keeps the fixture on public package imports and explicit plugins', () => {
    const fixtureRoot = path.dirname(resolve('../App.tsx'));
    const sources = [
      'App.tsx',
      'AutoLoggingConfig.ts',
      'DebugInspector.tsx',
      'EventStore.ts',
      'PackageEntryTypeAssertions.ts',
      'index.js',
    ].map((file) => fs.readFileSync(path.join(fixtureRoot, file), 'utf8'));
    const source = sources.join('\n');

    expect(source).not.toMatch(/hyperion-[^'"\s]+\/src(?:\/|['"])/);
    expect(source).not.toContain('hyperion-react-native/plugins');
    expect(source).toContain('hyperion-react-native/runtime');
    expect(source).toContain('hyperion-react-native/ui-events');
    expect(source).toContain('reactNativeUIEvents');
    expect(source).toContain('reactNativeSurfaces');
    expect(source).toContain('reactNativeHeartbeat');
    expect(source).toContain('AutoLoggingInspector');
    expect(source).toContain('SurfaceTreeInspector');
  });
});
