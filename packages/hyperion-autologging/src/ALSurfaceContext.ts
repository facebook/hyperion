/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from '@hyperion/global';
import type * as React from 'react';
import { ALFlowlet } from './ALFlowletManager';
import * as Types from "@hyperion/hyperion-util/src/Types";


export type InitOptions = Types.Options<{
  react: {
    ReactModule: {
      createContext: typeof React.createContext;
      useContext: typeof React.useContext;
    }
  }
}>;

export type ALSurfaceContextFilledValue = {
  nonInteractiveSurface: string;
  surface: string;
  flowlet: ALFlowlet;
};

type ALSurfaceContextValue =
  ALSurfaceContextFilledValue
  | {
    nonInteractiveSurface: null;
    surface: null;
    flowlet: null;
  };

const DefaultSurfaceContext: ALSurfaceContextValue = {
  nonInteractiveSurface: null,
  surface: null,
  flowlet: null,
};

export let ALSurfaceContext: React.Context<ALSurfaceContextValue> | null = null;


let ReactModule: InitOptions['react']['ReactModule'] | null = null;

export function init(options: InitOptions): React.Context<ALSurfaceContextValue> {
  assert(!ReactModule && !ALSurfaceContext, "Already initilized");

  ReactModule = options.react.ReactModule;
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
