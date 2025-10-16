/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from 'hyperion-globals';
import * as React from 'react';
import * as Types from "hyperion-util/src/Types";
import { ALSurfaceData } from './ALSurfaceData';
import * as IReact from "hyperion-react/src/IReact";
import { SafeGetterSetter } from 'hyperion-util/src/SafeGetterSetter';


export type InitOptions = Types.Options<{
}>;

export type ALSurfaceContextFilledValue = ALSurfaceData;

type ALSurfaceContextValue = ALSurfaceData | typeof ALSurfaceData.root;

const DefaultSurfaceContext: ALSurfaceContextValue = ALSurfaceData.root;

export const ALSurfaceContextInstance = new SafeGetterSetter<React.Context<ALSurfaceContextValue>>("ALSurfaceContext");



export function init(_options: InitOptions): React.Context<ALSurfaceContextValue> {
  assert(!ALSurfaceContextInstance.isSet(), "Already initilized");

  // ReactModule = options.react.ReactModule;
  const ReactModule = IReact.ReactModule.get();
  ALSurfaceContextInstance.set(ReactModule.createContext(
    DefaultSurfaceContext,
  ));

  return ALSurfaceContextInstance.get();
};


export function useALSurfaceContext(): ALSurfaceContextValue {
  if (!ALSurfaceContextInstance.isSet()) {
    return DefaultSurfaceContext;
  }

  const context = IReact.ReactModule.get().useContext(ALSurfaceContextInstance.get());
  assert(!!context, 'useALSurfaceContext must be used within an ALSurface',);
  return context ?? DefaultSurfaceContext;
}
