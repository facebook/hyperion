/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IReact from 'hyperion-react/src/IReact';
import * as IReactComponent from 'hyperion-react/src/IReactComponent';
import ReactDev from 'react/jsx-runtime';
import React from 'react';
import * as IPromise from 'hyperion-core/src/IPromise';
import TestAndSet from 'hyperion-test-and-set/src/TestAndSet';
import interceptReactProps from './interceptReactProps';

globalThis.__DEV__ = true;

export let initializationStatus = 'not_initialized';

const initialized = new TestAndSet();

export interface SurfaceTreeNode {
  surface: string;
  nonInteractiveSurface: string;
  parent: string | null;
  children: string[];
  capability: any;
  metadata: any;
  isProxy: boolean;
  mountTime: number;
}

export const surfaceTree = new Map<string, SurfaceTreeNode>();

export interface TrackedEvent {
  surface: string;
  eventType: string;
  timestamp: number;
  data: any;
}

export const eventLog: TrackedEvent[] = [];

export function init() {

  if (initialized.testAndSet()) {
    return;
  }

  console.log('Running AL init!');
  initializationStatus = 'initializing';

  try {
    initializeReactInterception();
    initializationStatus = 'initialized';
    console.log('React Native AutoLogging initialized successfully');
    return;
  } catch (error) {
    console.error('Failed to initialize React Native AutoLogging:', error);
    return;
  }
}

function initializeReactInterception() {
  const RENDER_FUNCTION_INTERCEPTED = '__IS_RENDER_INTERCEPTED__TODO_LIST';
  function observer(name: string) {
    return function <T, V>(this: T, value: V) {
      console.log(name, this, value);
      trackEvent('react-interception', name, { context: this, value });
    };
  }

  function observer1(name: string) {
    return function <T>(this: T) {
      console.log(name, this);
    }
  }

  // ReactModule/JSX
  const IReactModule = IReact.intercept('react', React as any, []);
  const IJsxRuntimeModule = IReact.interceptRuntime(
    'react/jsx-runtime',
    ReactDev as any,
    []
  );

  /**
   * *****************************
   * IReactComponent / JSX - END
   * *****************************
   */
  IReactComponent.init({
    ReactModule: React as any,
    IReactModule,
    IJsxRuntimeModule: IJsxRuntimeModule as any,
    enableInterceptClassComponentConstructor: true,
    enableInterceptClassComponentMethods: true,
    enableInterceptFunctionComponentRender: true,
    enableInterceptDomElement: true,
    enableInterceptComponentElement: true,
    enableInterceptSpecialElement: true,
  });

  IReactComponent.onReactClassComponentElement.add((component, props) => {
    const prefix = `[${component.name}][Class]`;
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix + '[' + key + ']'));
    }
  });

  IReactComponent.onReactFunctionComponentElement.add((component, props) => {
    const prefix = `[${component.name || component.displayName}][Func]`;
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix + '[' + key + ']'));
    }
  });

  IReactComponent.onReactDOMElement.add((element, props) => {
    const prefix = `[${element}][DOM]`;
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix + '[' + key + ']'));
    }
  });

  IReactComponent.onReactClassComponentIntercept.add(shadow => {
    const render = shadow.render;
    if (!render.testAndSet(RENDER_FUNCTION_INTERCEPTED)) {
      const name = render.getOriginal().name ?? shadow.name
      render.onBeforeCallObserverAdd(observer1(`[${name}][Class][render]`));
    }
  })

  IReactComponent.onReactFunctionComponentIntercept.add(render => {
    const name: string = render.getOriginal().displayName ?? render.name;
    if (!render.testAndSet(RENDER_FUNCTION_INTERCEPTED) && name != null) {
      render.onBeforeCallObserverAdd(observer1(`[${name}][Func][render]`));
    }
  });

  /**
   * *****************************
   * IReactComponent / JSX - END
   * *****************************
   */

  // Add Promise interception for debugging
  IPromise.resolve.onBeforeCallObserverAdd(observer('IPromise.resolve'));
  IPromise.reject.onBeforeCallObserverAdd(observer('IPromise.reject'));
  IPromise.all.onBeforeCallObserverAdd(observer('IPromise.all'));
}

export function trackEvent(surface: string, eventType: string, data: any = {}) {
  const event: TrackedEvent = {
    surface,
    eventType,
    timestamp: Date.now(),
    data,
  };

  eventLog.push(event);

  // Keep only last 100 events
  if (eventLog.length > 100) {
    eventLog.shift();
  }
}

export function trackSurfaceMount(
  surface: string,
  nonInteractiveSurface: string,
  parent: string | null,
  capability: any,
  metadata: any
) {
  const node: SurfaceTreeNode = {
    surface,
    nonInteractiveSurface,
    parent,
    children: [],
    capability,
    metadata,
    isProxy: false,
    mountTime: Date.now(),
  };

  surfaceTree.set(nonInteractiveSurface, node);

  if (parent) {
    const parentPath = nonInteractiveSurface.substring(
      0,
      nonInteractiveSurface.lastIndexOf('/')
    );
    const parentNode = surfaceTree.get(parentPath);
    if (parentNode && !parentNode.children.includes(surface)) {
      parentNode.children.push(surface);
    }
  }

  trackEvent(surface, 'surface_mount', { capability, metadata });
}

export function trackSurfaceUnmount(
  surface: string,
  nonInteractiveSurface: string
) {
  const node = surfaceTree.get(nonInteractiveSurface);
  if (node) {
    if (node.parent) {
      const parentPath = nonInteractiveSurface.substring(
        0,
        nonInteractiveSurface.lastIndexOf('/')
      );
      const parentNode = surfaceTree.get(parentPath);
      if (parentNode) {
        parentNode.children = parentNode.children.filter(
          (child) => child !== surface
        );
      }
    }
  }

  surfaceTree.delete(nonInteractiveSurface);

  trackEvent(surface, 'surface_unmount');
}

export function getSurfaceTree(): Map<string, SurfaceTreeNode> {
  return new Map(surfaceTree);
}

export function getSurfaceTreeHierarchy(): any {
  const tree: any = {};

  for (const [path, node] of surfaceTree) {
    const parts = path.split('/').filter(Boolean);
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {
          surface: node.surface,
          nonInteractiveSurface: node.nonInteractiveSurface,
          capability: node.capability,
          metadata: node.metadata,
          mountTime: node.mountTime,
          children: {},
        };
      }
      current = current[part].children;
    }
  }

  return tree;
}

export function getEventLog(): TrackedEvent[] {
  return [...eventLog];
}

export function getEventsForSurface(surface: string): TrackedEvent[] {
  return eventLog.filter((event) => event.surface === surface);
}

export function getInitializationStatus(): string {
  return initializationStatus;
}

export function getSurfaceStats() {
  const surfaces = Array.from(surfaceTree.values());
  const interactiveSurfaces = surfaces.filter(
    (s) => !s.capability?.nonInteractive
  );
  const nonInteractiveSurfaces = surfaces.filter(
    (s) => s.capability?.nonInteractive
  );

  return {
    totalSurfaces: surfaces.length,
    interactiveSurfaces: interactiveSurfaces.length,
    nonInteractiveSurfaces: nonInteractiveSurfaces.length,
    totalEvents: eventLog.length,
    maxDepth:
      surfaces.length > 0
        ? Math.max(
            ...surfaces.map(
              (s) => s.nonInteractiveSurface.split('/').filter(Boolean).length
            )
          )
        : 0,
    initializationStatus,
  };
}

export function clearAll() {
  surfaceTree.clear();
  eventLog.length = 0;
  console.log('Cleared all surface tree and event data');
}
