/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = resolve(__dirname, '../../..');
const distributionDirectory = resolve(repositoryRoot, 'dist');

function getImports(code: string): string[] {
  return Array.from(
    code.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
    (match) => match[1]
  ).sort();
}

function getExports(code: string): string[] {
  const exportBlock = code.match(/export \{([^}]+)\};/s);
  expect(exportBlock).not.toBeNull();
  return (exportBlock?.[1] ?? '')
    .split(',')
    .map(
      (entry) =>
        entry
          .trim()
          .split(/\s+as\s+/)
          .at(-1) ?? ''
    )
    .filter(Boolean)
    .sort();
}

describe('web distribution compatibility contract', () => {
  it('retains the existing generated artifact set', () => {
    expect(
      readdirSync(distributionDirectory)
        .filter((fileName) => fileName.endsWith('.js'))
        .sort()
    ).toEqual([
      'hyperionAsyncCounter.js',
      'hyperionAutoLogging.js',
      'hyperionAutoLoggingPluginEventHash.js',
      'hyperionAutoLoggingVisualizer.js',
      'hyperionChannel.js',
      'hyperionCore.js',
      'hyperionDOM.js',
      'hyperionFlowlet.js',
      'hyperionFlowletCore.js',
      'hyperionGlobals.js',
      'hyperionHook.js',
      'hyperionReact.js',
      'hyperionSyncMutationObserver.js',
      'hyperionTestAndSet.js',
      'hyperionTimedTrigger.js',
      'hyperionTrackElementsWithAttributes.js',
      'hyperionUtil.js',
      'index.js',
    ]);
  });

  it('retains the AutoLogging chunk boundary and public exports', () => {
    const code = readFileSync(
      resolve(distributionDirectory, 'hyperionAutoLogging.js'),
      'utf8'
    );

    expect(getImports(code)).toEqual([
      'hyperionChannel',
      'hyperionCore',
      'hyperionDOM',
      'hyperionFlowlet',
      'hyperionFlowletCore',
      'hyperionGlobals',
      'hyperionHook',
      'hyperionReact',
      'hyperionTestAndSet',
      'hyperionTimedTrigger',
      'hyperionUtil',
    ]);
    expect(getExports(code)).toEqual(
      [
        'ALCustomEvent',
        'ALElementInfo',
        'ALEventExtension',
        'ALEventIndex',
        'ALFlowlet',
        'ALFlowletManager',
        'ALFlowletManagerInstance',
        'ALHeartbeatType',
        'ALInteractableDOMElement',
        'ALSurfaceChannel',
        'ALSurfaceData',
        'ALSurfaceUtils',
        'AutoLogging',
        'SURFACE_SEPARATOR',
        'Surface',
        'getCurrentUIEventData',
        'getOrSetAutoLoggingID',
        'getSessionFlowID',
        'useALSurfaceContext',
      ].sort()
    );
    expect(code).not.toContain('react-native');
  });
});
