/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Fragment, jsxDEV as reactJSXDEV } from 'react/jsx-dev-runtime';
import {
  createObservedJSXFunction,
  type JSXRuntimeFunction,
} from './ReactNativeElementObservation';

export { Fragment };
export const jsxDEV = createObservedJSXFunction(
  reactJSXDEV as JSXRuntimeFunction
) as typeof reactJSXDEV;
