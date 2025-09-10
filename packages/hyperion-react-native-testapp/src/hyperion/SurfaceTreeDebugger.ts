/**
 * React Native Surface Tree Debugger
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import {
  getAllALSurfaces,
  clearALSurfaceRegistry,
} from 'hyperion-autologging/src/ALSurface';

export function printRNSurfaceTree(): void {
  const rnSurfaces = getAllALSurfaces();

  console.log('\n🚀 === RN SURFACE REGISTRY ===');
  console.log(`📊 Total RNSurfaces: ${rnSurfaces.size}`);

  if (rnSurfaces.size === 0) {
    console.log('\n(No RNSurfaces currently registered)');
    return;
  }

  console.log('\n🌳 RNSurface Tree:');
  const sortedSurfaces = Array.from(rnSurfaces.entries())
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB));

  sortedSurfaces.forEach(([path, surfaceData]) => {
    const depth = path.split('/').filter(Boolean).length;
    const indent = '  '.repeat(depth - 1);
    const isInteractive = !surfaceData.capability?.nonInteractive;
    const icon = isInteractive ? '🔴' : '🔵';

    console.log(`${indent}${icon} ${surfaceData.surfaceName}`);
    console.log(`${indent}   Path: ${surfaceData.surface}`);
    console.log(`${indent}   Non-Interactive Path: ${surfaceData.nonInteractiveSurface}`);

    const elements = surfaceData.getElements();
    if (elements.length > 0) {
      console.log(`${indent}   Elements: ${elements.length} (${elements.join(', ')})`);
    }

    if (surfaceData.capability) {
      console.log(`${indent}   Capability:`, surfaceData.capability);
    }

    if (Object.keys(surfaceData.metadata || {}).length > 0) {
      console.log(`${indent}   Metadata:`, surfaceData.metadata);
    }

    console.log(`${indent}   Flowlet: ${surfaceData.callFlowlet.getFullName()}`);
    console.log('');
  });
}

export function printRNSurfaceStats(): void {
  const rnSurfaces = getAllALSurfaces();
  const surfaces = Array.from(rnSurfaces.values());

  const interactive = surfaces.filter(s => !s.capability?.nonInteractive);
  const nonInteractive = surfaces.filter(s => s.capability?.nonInteractive);
  const withMetadata = surfaces.filter(s => Object.keys(s.metadata || {}).length > 0);

  console.log('\n📊 === RN SURFACE STATISTICS ===');
  console.log(`🌳 Total RNSurfaces: ${surfaces.length}`);
  console.log(`🔴 Interactive: ${interactive.length}`);
  console.log(`🔵 Non-Interactive: ${nonInteractive.length}`);
  console.log(`📝 With Metadata: ${withMetadata.length}`);

  if (surfaces.length > 0) {
    const depths = surfaces.map(s => s.nonInteractiveSurface.split('/').filter(Boolean).length);
    console.log(`📏 Max Depth: ${Math.max(...depths)}`);
    console.log(`📐 Min Depth: ${Math.min(...depths)}`);
  }
}

export function findRNSurfaces(pattern: string) {
  const rnSurfaces = getAllALSurfaces();
  const regex = new RegExp(pattern, 'i');

  const matches = Array.from(rnSurfaces.entries())
    .filter(([path, data]) =>
      regex.test(path) ||
      regex.test(data.surfaceName) ||
      regex.test(data.surface)
    );

  console.log(`\n🔍 === RN SURFACES MATCHING "${pattern}" ===`);

  if (matches.length === 0) {
    console.log('(No matches found)');
    return [];
  }

  matches.forEach(([path, data]) => {
    console.log(`🎯 ${data.surfaceName}`);
    console.log(`   Path: ${data.surface}`);
    console.log(`   Registry Key: ${path}`);
    console.log('');
  });

  return matches;
}

export function getRNSurfaceByName(surfaceName: string) {
  const rnSurfaces = getAllALSurfaces();

  for (const [path, data] of rnSurfaces) {
    if (data.surfaceName === surfaceName) {
      console.log(`\n🎯 === RN SURFACE: ${surfaceName} ===`);
      console.log(`Surface Path: ${data.surface}`);
      console.log(`Non-Interactive Path: ${data.nonInteractiveSurface}`);
      console.log(`Capability:`, data.capability);
      console.log(`Metadata:`, data.metadata);
      console.log(`Elements:`, data.getElements());
      console.log(`Flowlet: ${data.callFlowlet.getFullName()}`);
      return data;
    }
  }

  console.log(`❌ RNSurface "${surfaceName}" not found`);
  return null;
}

export function clearAllRNSurfaces(): void {
  clearALSurfaceRegistry();
  console.log('🗑️ Cleared all RNSurface registry data');
}

declare global {
  var SurfaceDebugger: {
    help: () => void;
    logRNSurfaces: () => void;
    statsRN: () => void;
    findRN: (pattern: string) => any[];
    getRN: (surfaceName: string) => any;
    clearRN: () => void;
  };
}

globalThis.SurfaceDebugger = {
  logRNSurfaces: printRNSurfaceTree,
  statsRN: printRNSurfaceStats,
  findRN: findRNSurfaces,
  getRN: getRNSurfaceByName,
  clearRN: clearAllRNSurfaces,
  help: () => {
    console.log(`
🛠️ Surface Debugger Commands:

🚀 SurfaceDebugger.logRNSurfaces()     - Log RNSurface registry tree
📊 SurfaceDebugger.statsRN()           - Show RNSurface statistics
🔍 SurfaceDebugger.findRN('todo')      - Find RNSurfaces matching pattern
🎯 SurfaceDebugger.getRN('todo-item')  - Get specific RNSurface by name
🗑️ SurfaceDebugger.clearRN()          - Clear all RNSurface data

❓ SurfaceDebugger.help()              - Show this help

Examples:
  SurfaceDebugger.logRNSurfaces()      // Most useful for RNSurface debugging!
  SurfaceDebugger.statsRN()
  SurfaceDebugger.findRN('todo-item')
  SurfaceDebugger.getRN('app-root')
  `);
  },
};
