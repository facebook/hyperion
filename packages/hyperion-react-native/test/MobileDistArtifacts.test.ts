/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import mobileDistUtils from '../../../scripts/mobile-dist-utils.cjs';

const {
  LEGACY_CHANNEL_EXPORTS,
  LEGACY_RUNTIME_INSTALLER_ARTIFACT,
  LEGACY_RUNTIME_INSTALLER_DEPENDENCY,
  NATIVE_ONLY_ARTIFACTS,
  PORTABLE_NATIVE_ALIASES,
  REACT_NATIVE_CONVENIENCE_ARTIFACTS,
  REACT_NATIVE_MODERN_ENTRIES,
  REACT_NATIVE_PLUGIN_ARTIFACTS,
  REACT_NATIVE_PORTABLE_ENTRIES,
  getNativeArtifactName,
  getNamedExports,
  getRuntimeSpecifiers,
  getSideEffectImportSpecifiers,
  hasDefaultExport,
  rewriteHasteSpecifiers,
} = mobileDistUtils as {
  LEGACY_CHANNEL_EXPORTS: readonly string[];
  LEGACY_RUNTIME_INSTALLER_ARTIFACT: string;
  LEGACY_RUNTIME_INSTALLER_DEPENDENCY: string;
  NATIVE_ONLY_ARTIFACTS: readonly string[];
  PORTABLE_NATIVE_ALIASES: readonly string[];
  REACT_NATIVE_CONVENIENCE_ARTIFACTS: readonly string[];
  REACT_NATIVE_MODERN_ENTRIES: readonly string[];
  REACT_NATIVE_PLUGIN_ARTIFACTS: readonly string[];
  REACT_NATIVE_PORTABLE_ENTRIES: readonly string[];
  getNativeArtifactName(artifact: string): string;
  getNamedExports(code: string): ReadonlySet<string>;
  getRuntimeSpecifiers(code: string): string[];
  getSideEffectImportSpecifiers(code: string): string[];
  hasDefaultExport(code: string): boolean;
  rewriteHasteSpecifiers(code: string): string;
};

const packageRoot = path.resolve(__dirname, '..');
const declarationRoot = path.join(packageRoot, 'dist');

describe('React Native distribution helpers', () => {
  test('keeps native runtime entries out of generic filenames', () => {
    expect(NATIVE_ONLY_ARTIFACTS.map(getNativeArtifactName)).toEqual([
      'hyperionMobileReactNativeJSXRuntime.react.native.js',
      'hyperionMobileReactNativeJSXDevRuntime.react.native.js',
    ]);
    expect(PORTABLE_NATIVE_ALIASES).toEqual(['hyperionMobileReactNative.js']);
    expect(REACT_NATIVE_PLUGIN_ARTIFACTS).toEqual([
      'hyperionMobileReactNativeSurfaces.js',
      'hyperionMobileReactNativeUIEvents.js',
      'hyperionMobileReactNativeAppLifecycle.js',
      'hyperionMobileReactNativeHeartbeat.js',
      'hyperionMobileReactNativeAppStateEvents.js',
      'hyperionMobileReactNativeScreens.js',
      'hyperionMobileReactNativeListImpressions.js',
      'hyperionMobileReactNativeDeepLinks.js',
      'hyperionMobileReactNativeReactErrors.js',
    ]);
    expect(REACT_NATIVE_CONVENIENCE_ARTIFACTS).toEqual([
      'hyperionMobileReactNativeLifecycle.js',
    ]);
    expect(REACT_NATIVE_PORTABLE_ENTRIES).toEqual([
      'hyperionMobileReactNativeRuntime.js',
      ...REACT_NATIVE_PLUGIN_ARTIFACTS,
      ...REACT_NATIVE_CONVENIENCE_ARTIFACTS,
      'hyperionMobileReactNativeTransport.js',
    ]);
    expect(REACT_NATIVE_MODERN_ENTRIES).toEqual([
      'hyperionMobileReactNativeRuntime.js',
      ...REACT_NATIVE_PLUGIN_ARTIFACTS,
      'hyperionMobileReactNativeTransport.js',
    ]);
  });

  test('rewrites generated relative imports to bare Haste names', () => {
    const generated = rewriteHasteSpecifiers(`
      import './hyperionMobileSideEffect.js';
      import {observe} from './hyperionMobileObservation.js';
      export {install} from './hyperionMobileInstaller.js';
      const runtime = import('./hyperionMobileRuntime.js');
      const required = require('./hyperionMobileRequired.js');
      import {jsx} from 'react/jsx-runtime';
    `);

    expect(getRuntimeSpecifiers(generated)).toEqual([
      'hyperionMobileSideEffect',
      'hyperionMobileObservation',
      'hyperionMobileInstaller',
      'hyperionMobileRuntime',
      'react/jsx-runtime',
      'hyperionMobileRequired',
    ]);
    expect(generated).not.toContain("'./hyperionMobile");
  });

  test('detects side-effect-only imports rejected by WWW', () => {
    expect(
      getSideEffectImportSpecifiers(`
        import 'react';
        import "hyperionMobileGuid";
        import {guid} from 'hyperionMobileGuid';
        export {mergeMetadata} from 'hyperionMobileReactNativeMetadata';
        const runtime = import('hyperionMobileReactNativeRuntime');
      `)
    ).toEqual(['react', 'hyperionMobileGuid']);
  });

  test('keeps the legacy installer isolated on JSX observation', () => {
    expect(LEGACY_RUNTIME_INSTALLER_ARTIFACT).toBe(
      'hyperionMobileReactNativeLegacyRuntimeInstaller.js'
    );
    expect(LEGACY_RUNTIME_INSTALLER_DEPENDENCY).toBe(
      'hyperionMobileReactNativeJSXObservation'
    );
  });

  test('preserves the complete legacy mobile Channel export surface', () => {
    expect(LEGACY_CHANNEL_EXPORTS).toEqual([
      'Channel',
      'Hook',
      'PausableChannel',
      'PipeableEmitter',
      'ResilientChannel',
    ]);
    expect(
      Array.from(
        getNamedExports(
          'export { Channel, Hook as Hook, PausableChannel, PipeableEmitter, ResilientChannel };'
        )
      ).sort()
    ).toEqual([...LEGACY_CHANNEL_EXPORTS].sort());
  });

  test('loads legacy mobile Core and React artifacts against the Channel artifact', () => {
    const validation = spawnSync(
      process.execPath,
      [
        path.resolve(
          packageRoot,
          '../../scripts/validate-legacy-mobile-runtime.mjs'
        ),
      ],
      {
        cwd: path.resolve(packageRoot, '../..'),
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      }
    );
    if (validation.status !== 0) {
      throw new Error(validation.stderr || validation.stdout);
    }
    expect(JSON.parse(validation.stdout.trim())).toEqual({
      channelArtifact: expect.stringMatching(/^(?:dist-mobile|generated)$/),
      channelCalls: 1,
      channelExports: [...LEGACY_CHANNEL_EXPORTS],
      coreImports: expect.arrayContaining(['hyperionMobileChannel']),
      coreLoaded: true,
      hookCalls: 1,
      pausableCalls: 1,
      pipedCalls: 1,
      reactImports: expect.arrayContaining([
        'hyperionMobileChannel',
        'hyperionMobileCore',
        'hyperionMobileTestAndSet',
        'hyperionMobileUtil',
      ]),
      reactLoaded: true,
      resilientCalls: 1,
      resilientErrors: 1,
    });
  });

  test('detects conditional-loader-compatible default exports', () => {
    expect(hasDefaultExport('export default value;')).toBe(true);
    expect(hasDefaultExport('export { value as default, named };')).toBe(true);
    expect(hasDefaultExport('export { named };')).toBe(false);
  });

  test('keeps split entry declarations below the aggregate and acyclic', () => {
    const packageJSON = JSON.parse(
      fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
    ) as {
      exports: Record<string, { types?: string }>;
    };
    const splitEntries = [
      './runtime',
      './surfaces',
      './ui-events',
      './lifecycle',
      './app-lifecycle',
      './heartbeat',
      './app-state-events',
      './screens',
      './list-impressions',
      './deep-links',
      './react-errors',
      './transport',
    ];
    const declarations = new Map<string, readonly string[]>();
    for (const fileName of fs
      .readdirSync(declarationRoot)
      .filter((name) => name.endsWith('.d.ts'))) {
      const source = fs.readFileSync(
        path.join(declarationRoot, fileName),
        'utf8'
      );
      declarations.set(fileName, getRelativeDeclarations(source));
    }

    for (const entry of splitEntries) {
      const declaration = packageJSON.exports[entry]?.types;
      expect(declaration).toBeDefined();
      const fileName = path.basename(declaration as string);
      const source = fs.readFileSync(
        path.join(declarationRoot, fileName),
        'utf8'
      );
      expect(source).not.toMatch(
        /from ['"]\.\/(?:index|plugins|AutoLogging)['"]/
      );
      expect(findDeclarationCycle(fileName, declarations)).toBeNull();
    }
  });
});

function getRelativeDeclarations(source: string): readonly string[] {
  return Array.from(
    source.matchAll(/(?:from\s+|import\s*\()(['"])(\.\/[^'"]+)\1/g),
    (match) => `${path.basename(match[2])}.d.ts`
  ).filter((fileName) => fs.existsSync(path.join(declarationRoot, fileName)));
}

function findDeclarationCycle(
  entry: string,
  declarations: ReadonlyMap<string, readonly string[]>
): readonly string[] | null {
  const visited = new Set<string>();
  const active = new Set<string>();
  const pathToEntry: string[] = [];
  const visit = (fileName: string): readonly string[] | null => {
    if (active.has(fileName)) {
      return [...pathToEntry.slice(pathToEntry.indexOf(fileName)), fileName];
    }
    if (visited.has(fileName)) return null;
    visited.add(fileName);
    active.add(fileName);
    pathToEntry.push(fileName);
    for (const dependency of declarations.get(fileName) ?? []) {
      const cycle = visit(dependency);
      if (cycle != null) return cycle;
    }
    pathToEntry.pop();
    active.delete(fileName);
    return null;
  };
  return visit(entry);
}
