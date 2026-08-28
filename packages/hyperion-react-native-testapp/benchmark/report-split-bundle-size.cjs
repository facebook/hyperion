/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const outputDirectory = path.join(packageRoot, 'dist', 'split-bundles');
const generatedDirectory = path.join(outputDirectory, 'entries');
const reactNativeCLI = path.join(
  packageRoot,
  'node_modules',
  'react-native',
  'cli.js'
);
const hermesCompiler = path.join(
  packageRoot,
  'node_modules',
  'react-native',
  'sdks',
  'hermesc',
  'osx-bin',
  'hermesc'
);

const pluginMarkers = Object.freeze({
  surfaces: 'react-native-surfaces',
  'ui-events': 'react-native-ui-events',
  'app-lifecycle': 'react-native-app-lifecycle',
  heartbeat: 'react-native-heartbeat',
  'app-state-events': 'react-native-app-state-events',
  screens: 'react-native-screens',
  'list-impressions': 'react-native-list-impressions',
  'deep-links': 'react-native-deep-links',
  'react-errors': 'react-native-react-errors',
});

const profiles = [
  { name: 'baseline', modules: [], markers: [] },
  { name: 'runtime', modules: ['runtime'], markers: [] },
  { name: 'surfaces', modules: ['runtime', 'surfaces'], markers: ['surfaces'] },
  {
    name: 'ui-events',
    modules: ['runtime', 'ui-events'],
    markers: ['ui-events'],
  },
  {
    name: 'app-lifecycle',
    modules: ['runtime', 'app-lifecycle'],
    markers: ['app-lifecycle'],
  },
  {
    name: 'heartbeat',
    modules: ['runtime', 'app-lifecycle', 'heartbeat'],
    markers: ['app-lifecycle', 'heartbeat'],
  },
  {
    name: 'app-state-events',
    modules: ['runtime', 'app-lifecycle', 'app-state-events'],
    markers: ['app-lifecycle', 'app-state-events'],
  },
  { name: 'screens', modules: ['runtime', 'screens'], markers: ['screens'] },
  {
    name: 'list-impressions',
    modules: ['runtime', 'list-impressions'],
    markers: ['list-impressions'],
  },
  {
    name: 'deep-links',
    modules: ['runtime', 'deep-links'],
    markers: ['deep-links'],
  },
  {
    name: 'react-errors',
    modules: ['runtime', 'react-errors'],
    markers: ['react-errors'],
  },
  {
    name: 'transport',
    modules: ['runtime', 'transport'],
    markers: ['screens'],
  },
  {
    name: 'lifecycle-convenience',
    modules: ['runtime', 'lifecycle'],
    markers: ['app-lifecycle', 'heartbeat', 'app-state-events'],
  },
  {
    name: 'complete-split',
    modules: [
      'runtime',
      'surfaces',
      'ui-events',
      'app-lifecycle',
      'heartbeat',
      'app-state-events',
      'screens',
      'list-impressions',
      'deep-links',
      'react-errors',
      'transport',
    ],
    markers: Object.keys(pluginMarkers),
  },
  {
    name: 'complete-aggregate',
    modules: ['.'],
    markers: Object.keys(pluginMarkers),
  },
];

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(generatedDirectory, { recursive: true });

const results = profiles.map(bundleProfile);
const baseline = results[0];
const runtime = results[1];
const report = {
  baselineBytes: {
    metro: baseline.metroBytes,
    hermes: baseline.hermesBytes,
  },
  profiles: results.slice(1).map((result) => ({
    name: result.name,
    metroBytes: result.metroBytes - baseline.metroBytes,
    metroIncrementOverRuntime:
      result.metroBytes -
      baseline.metroBytes -
      (runtime.metroBytes - baseline.metroBytes),
    hermesBytes: result.hermesBytes - baseline.hermesBytes,
    hermesIncrementOverRuntime:
      result.hermesBytes -
      baseline.hermesBytes -
      (runtime.hermesBytes - baseline.hermesBytes),
  })),
};

fs.writeFileSync(
  path.join(outputDirectory, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`
);
console.log(JSON.stringify(report, null, 2));

function bundleProfile(profile) {
  const entryPath = path.join(generatedDirectory, `${profile.name}.js`);
  const metroPath = path.join(outputDirectory, `${profile.name}.ios.jsbundle`);
  const hermesPath = path.join(outputDirectory, `${profile.name}.ios.hbc`);
  fs.writeFileSync(entryPath, createEntrySource(profile.modules));
  run(process.execPath, [
    reactNativeCLI,
    'bundle',
    '--entry-file',
    path.relative(packageRoot, entryPath),
    '--platform',
    'ios',
    '--dev',
    'false',
    '--minify',
    'true',
    '--bundle-output',
    metroPath,
  ]);
  const bundleSource = fs.readFileSync(metroPath, 'utf8');
  const expectedMarkers = new Set(profile.markers);
  for (const [name, marker] of Object.entries(pluginMarkers)) {
    const included = bundleSource.includes(marker);
    if (included !== expectedMarkers.has(name)) {
      throw new Error(
        `${profile.name} ${
          included ? 'unexpectedly includes' : 'omits'
        } ${name}`
      );
    }
  }
  run(hermesCompiler, ['-emit-binary', '-O', '-out', hermesPath, metroPath]);
  return {
    name: profile.name,
    metroBytes: fs.statSync(metroPath).size,
    hermesBytes: fs.statSync(hermesPath).size,
  };
}

function createEntrySource(modules) {
  const imports = modules.map((moduleName, index) =>
    moduleName === '.'
      ? `import * as Module${index} from 'hyperion-react-native';`
      : `import Module${index} from 'hyperion-react-native/${moduleName}';`
  );
  return `${[
    "import React from 'react';",
    "import {AppRegistry, View} from 'react-native';",
    ...imports,
    `globalThis.__hyperionSplitBundle = [React, AppRegistry, View${modules
      .map((_moduleName, index) => `, Module${index}`)
      .join('')}];`,
  ].join('\n')}\n`;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 100 * 1024 * 1024,
  });
  if (result.status !== 0) {
    process.stderr.write((result.stdout ?? '').slice(-4_000));
    process.stderr.write((result.stderr ?? '').slice(-4_000));
    throw new Error(`${path.basename(command)} exited with ${result.status}`);
  }
}
