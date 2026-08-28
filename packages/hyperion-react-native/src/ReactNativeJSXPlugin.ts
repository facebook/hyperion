/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import type { ALReactNativePlugin } from './ALRuntime';
import {
  installReactNativeJSXRuntime,
  setElementInstrumenter,
  setElementObservationEnabled,
  type ElementInstrumenter,
  type JSXDevRuntimeModuleExports,
  type JSXRuntimeModuleExports,
  type ReactModuleExports,
} from './ReactNativeElementObservation';

export interface ReactNativeJSXPluginOptions {
  readonly ReactModule?: ReactModuleExports;
  readonly JSXRuntimeModule?: JSXRuntimeModuleExports;
  readonly JSXDevRuntimeModule?: JSXDevRuntimeModuleExports;
}

export function createReactNativeJSXPlugin<
  EventMap extends BaseChannelEventType
>(
  options: ReactNativeJSXPluginOptions,
  instrumenter: ElementInstrumenter,
  name = 'react-native-jsx-observation'
): ALReactNativePlugin<EventMap> {
  return {
    name,
    install() {
      if (
        options.ReactModule != null ||
        options.JSXRuntimeModule != null ||
        options.JSXDevRuntimeModule != null
      ) {
        installReactNativeJSXRuntime(
          options.ReactModule ?? {},
          options.JSXRuntimeModule,
          options.JSXDevRuntimeModule
        );
      }
      setElementInstrumenter(instrumenter);
      return {
        start() {
          setElementObservationEnabled(true);
        },
        dispose() {
          setElementObservationEnabled(false);
          setElementInstrumenter(null);
        },
      };
    },
  };
}
