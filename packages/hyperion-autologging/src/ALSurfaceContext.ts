/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from '@hyperion/global';
import type * as React from 'react';


export type InitOptions =
  Readonly<{
    ReactModule: {
      createContext: typeof React.createContext;
      useContext: typeof React.useContext;
    }
  }>;


type ALSurfaceContextValue = Readonly<{
  surface: string,
}>;

const DefaultSurfaceContext: ALSurfaceContextValue = {
  surface: '',
};

export let ALSurfaceContext: React.Context<ALSurfaceContextValue> | null = null;


let ReactModule: InitOptions['ReactModule'] | null = null;

export function init(options: InitOptions): React.Context<ALSurfaceContextValue> {
  assert(!ReactModule && !ALSurfaceContext, "Already initilized");

  ReactModule = options.ReactModule;
  ALSurfaceContext = ReactModule.createContext(
    DefaultSurfaceContext,
  );

  return ALSurfaceContext;
};


export function useALSurfaceContext(): ALSurfaceContextValue {
  if (!ReactModule || !ALSurfaceContext) {
    return DefaultSurfaceContext;
  }

  const context = ReactModule?.useContext(ALSurfaceContext);
  assert(!!context, 'useALSurfaceContext must be used within an ALSurface',);
  return context ?? DefaultSurfaceContext;
}
