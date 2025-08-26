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

declare global {
  var SurfaceDebugger: {
    logTree: () => void;
    logEvents: (limit?: number) => void;
    findSurfaces: (pattern: string) => SurfaceTreeNode[];
    getEventsFor: (surfaceName: string) => TrackedEvent[];
    exportState: () => any;
    help: () => void;
  };
}

globalThis.SurfaceDebugger = {
  logTree: printSurfaceTree,
  logEvents: printRecentEvents,
  findSurfaces: findSurfaces,
  getEventsFor: getEventsForSurface,
  exportState: exportCurrentState,
  help: () => {
    console.log(`
🛠️ Surface Debugger Commands:

📊 SurfaceDebugger.logTree()           - Log current surface tree hierarchy
🎯 SurfaceDebugger.logEvents(10)       - Log recent surface events (default: 10)
🔍 SurfaceDebugger.findSurfaces('todo') - Find surfaces matching pattern
📝 SurfaceDebugger.getEventsFor('todo') - Get events for specific surface
📤 SurfaceDebugger.exportState()       - Export full debugging state
❓ SurfaceDebugger.help()              - Show this help

Examples:
  SurfaceDebugger.logTree()
  SurfaceDebugger.logEvents(5)
  SurfaceDebugger.findSurfaces('todo-item')
  SurfaceDebugger.getEventsFor('app-root')
  `);
  },
};
