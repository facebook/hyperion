/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from '@hyperion/global';
import { Flowlet } from '@hyperion/hyperion-flowlet/src/Flowlet';
import type * as React from 'react';
import { FlowletDataType } from './ALSurface';


export type InitOptions =
  Readonly<{
    ReactModule: {
      createContext: typeof React.createContext;
      useContext: typeof React.useContext;
    }
  }>;


type ALSurfaceContextValue<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>
> = Readonly<{
  surface: string,
  flowlet: FlowletType | null,
}>;



function getDefaultSurfaceContext<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>
>(): ALSurfaceContextValue<DataType, FlowletType> {
  return {
    surface: '',
    flowlet: null,
  };
};

export let ALSurfaceContext: React.Context<any> | null = null;


let ReactModule: InitOptions['ReactModule'] | null = null;

export function init<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>
>(options: InitOptions): React.Context<ALSurfaceContextValue<DataType, FlowletType>> {
  assert(!ReactModule && !ALSurfaceContext, "Already initilized");

  ReactModule = options.ReactModule;
  ALSurfaceContext = ReactModule.createContext(
    getDefaultSurfaceContext<DataType, FlowletType>(),
  );

  return ALSurfaceContext;
};


export function useALSurfaceContext<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>
>(): ALSurfaceContextValue<DataType, FlowletType> {
  if (!ReactModule || !ALSurfaceContext) {
    return getDefaultSurfaceContext<DataType, FlowletType>();
  }

  const context = ReactModule?.useContext(ALSurfaceContext);
  assert(!!context, 'useALSurfaceContext must be used within an ALSurface',);
  return context ?? getDefaultSurfaceContext<DataType, FlowletType>();
}
