/**
 * React Native Surface Tree Debugger
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import {
  surfaceTree,
  getSurfaceTreeHierarchy,
  getSurfaceStats,
  getEventLog,
  SurfaceTreeNode,
  TrackedEvent,
} from './AutoLoggingWrapper';

import {
  getAllRNSurfaces,
  getRNSurfaceData,
  clearRNSurfaceRegistry,
} from 'hyperion-autologging/src/RNSurface';

export function printSurfaceTree(): void {
  const stats = getSurfaceStats();

  console.log('\n🌳 === REACT NATIVE SURFACE TREE ===');
  console.log(`📊 Total Surfaces: ${stats.totalSurfaces}`);
  console.log(`🔴 Interactive: ${stats.interactiveSurfaces}`);
  console.log(`🔵 Non-Interactive: ${stats.nonInteractiveSurfaces}`);
  console.log(`📏 Max Depth: ${stats.maxDepth}`);
  console.log(`🎯 Total Events: ${stats.totalEvents}`);

  if (stats.totalSurfaces > 0) {
    printOrderedHierarchy();
  } else {
    console.log('\n(No surfaces currently mounted)');
  }
}

function printOrderedHierarchy(): void {
  const surfaces = Array.from(surfaceTree.values());

  const surfacesByParent = new Map<string | null, typeof surfaces>();

  surfaces.forEach((surface) => {
    const parent = surface.parent;
    if (!surfacesByParent.has(parent)) {
      surfacesByParent.set(parent, []);
    }
    surfacesByParent.get(parent)!.push(surface);
  });

  const rootSurfaces = surfacesByParent.get(null) || [];
  rootSurfaces.forEach((surface) => {
    printSurfaceWithChildren(surface, surfacesByParent, 0);
  });
}

function printSurfaceWithChildren(
  surfaceTreeNode: SurfaceTreeNode,
  surfacesByParent: Map<string | null, SurfaceTreeNode[]>,
  depth: number
): void {
  const indent = '  '.repeat(depth);
  const isInteractive = !surfaceTreeNode.capability?.nonInteractive;
  const icon = isInteractive ? '🔴' : '🔵';

  const surfaceName =
    surfaceTreeNode.surface.split('/').pop() || surfaceTreeNode.surface;

  let metadataInfo = '';
  if (surfaceTreeNode.metadata?.index !== undefined) {
    metadataInfo = ` #${surfaceTreeNode.metadata.index}`;
  }
  if (surfaceTreeNode.metadata?.todoId) {
    metadataInfo += ` (id:${surfaceTreeNode.metadata.todoId})`;
  }

  console.log(`${indent}${icon} ${surfaceName} ${metadataInfo}`);

  const children = surfacesByParent.get(surfaceTreeNode.surface) || [];
  children.forEach((child) => {
    printSurfaceWithChildren(child, surfacesByParent, depth + 1);
  });
}

export function printRecentEvents(limit: number = 10): void {
  const events = getEventLog().slice(-limit);

  console.log('\n === RECENT SURFACE EVENTS ===');
  if (events.length === 0) {
    console.log('(No events recorded)');
  } else {
    events.forEach((event, index) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      console.log(
        `${index + 1}. [${time}] ${event.eventType} - ${event.surface}`
      );
    });
  }
}

export function findSurfaces(pattern: string): SurfaceTreeNode[] {
  const regex = new RegExp(pattern, 'i');
  return Array.from(surfaceTree.values()).filter(
    (surface) =>
      regex.test(surface.surface) || regex.test(surface.nonInteractiveSurface)
  );
}

export function getEventsForSurface(surfaceName: string): TrackedEvent[] {
  return getEventLog().filter((event) => event.surface.includes(surfaceName));
}

export function exportCurrentState(): {
  timestamp: number;
  stats: any;
  hierarchy: any;
  surfaces: SurfaceTreeNode[];
  recentEvents: TrackedEvent[];
} {
  return {
    timestamp: Date.now(),
    stats: getSurfaceStats(),
    hierarchy: getSurfaceTreeHierarchy(),
    surfaces: Array.from(surfaceTree.values()),
    recentEvents: getEventLog().slice(-20),
  };
}

export function printRNSurfaceTree(): void {
  const rnSurfaces = getAllRNSurfaces();

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
    console.log(`${indent}   Path: ${surfaceData.surfacePath}`);
    console.log(`${indent}   Non-Interactive Path: ${surfaceData.nonInteractiveSurfacePath}`);

    if (surfaceData.componentIds.size > 0) {
      console.log(`${indent}   Component IDs: ${Array.from(surfaceData.componentIds).join(', ')}`);
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
  const rnSurfaces = getAllRNSurfaces();
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
    const depths = surfaces.map(s => s.nonInteractiveSurfacePath.split('/').filter(Boolean).length);
    console.log(`📏 Max Depth: ${Math.max(...depths)}`);
    console.log(`📐 Min Depth: ${Math.min(...depths)}`);
  }
}

export function findRNSurfaces(pattern: string) {
  const rnSurfaces = getAllRNSurfaces();
  const regex = new RegExp(pattern, 'i');

  const matches = Array.from(rnSurfaces.entries())
    .filter(([path, data]) =>
      regex.test(path) ||
      regex.test(data.surfaceName) ||
      regex.test(data.surfacePath)
    );

  console.log(`\n🔍 === RN SURFACES MATCHING "${pattern}" ===`);

  if (matches.length === 0) {
    console.log('(No matches found)');
    return [];
  }

  matches.forEach(([path, data]) => {
    console.log(`🎯 ${data.surfaceName}`);
    console.log(`   Path: ${data.surfacePath}`);
    console.log(`   Registry Key: ${path}`);
    console.log('');
  });

  return matches;
}

export function getRNSurfaceByName(surfaceName: string) {
  const rnSurfaces = getAllRNSurfaces();

  for (const [path, data] of rnSurfaces) {
    if (data.surfaceName === surfaceName) {
      console.log(`\n🎯 === RN SURFACE: ${surfaceName} ===`);
      console.log(`Surface Path: ${data.surfacePath}`);
      console.log(`Non-Interactive Path: ${data.nonInteractiveSurfacePath}`);
      console.log(`Capability:`, data.capability);
      console.log(`Metadata:`, data.metadata);
      console.log(`Component IDs:`, Array.from(data.componentIds));
      console.log(`Flowlet: ${data.callFlowlet.getFullName()}`);
      return data;
    }
  }

  console.log(`❌ RNSurface "${surfaceName}" not found`);
  return null;
}

export function clearAllRNSurfaces(): void {
  clearRNSurfaceRegistry();
  console.log('🗑️ Cleared all RNSurface registry data');
}

export function compareRNSurfaceWithAutoLogging(): void {
  const rnSurfaces = getAllRNSurfaces();
  const autoLoggingSurfaces = surfaceTree;

  console.log('\n⚡ === RN SURFACE vs AUTO LOGGING COMPARISON ===');
  console.log(`🚀 RNSurfaces: ${rnSurfaces.size}`);
  console.log(`🏠 AutoLogging Surfaces: ${autoLoggingSurfaces.size}`);
  console.log('');

  console.log('📋 RNSurface Registry:');
  Array.from(rnSurfaces.keys()).forEach(path => {
    console.log(`  🚀 ${path}`);
  });

  console.log('\n📋 AutoLogging Registry:');
  Array.from(autoLoggingSurfaces.keys()).forEach(path => {
    console.log(`  🏠 ${path}`);
  });
}

declare global {
  var SurfaceDebugger: {
    help: () => void;
    logRNSurfaces: () => void;
    statsRN: () => void;
    findRN: (pattern: string) => any[];
    getRN: (surfaceName: string) => any;
    clearRN: () => void;
    compare: () => void;
  };
}

globalThis.SurfaceDebugger = {
  logRNSurfaces: printRNSurfaceTree,
  statsRN: printRNSurfaceStats,
  findRN: findRNSurfaces,
  getRN: getRNSurfaceByName,
  clearRN: clearAllRNSurfaces,
  compare: compareRNSurfaceWithAutoLogging,
  help: () => {
    console.log(`
🛠️ Surface Debugger Commands:

🚀 SurfaceDebugger.logRNSurfaces()     - Log RNSurface registry tree
📊 SurfaceDebugger.statsRN()           - Show RNSurface statistics
🔍 SurfaceDebugger.findRN('todo')      - Find RNSurfaces matching pattern
🎯 SurfaceDebugger.getRN('todo-item')  - Get specific RNSurface by name
🗑️ SurfaceDebugger.clearRN()          - Clear all RNSurface data
⚡ SurfaceDebugger.compare()           - Compare RNSurface vs AutoLogging registries

❓ SurfaceDebugger.help()              - Show this help

Examples:
  SurfaceDebugger.logRNSurfaces()      // Most useful for RNSurface debugging!
  SurfaceDebugger.statsRN()
  SurfaceDebugger.findRN('todo-item')
  SurfaceDebugger.getRN('app-root')
  SurfaceDebugger.compare()
  `);
  },
};
