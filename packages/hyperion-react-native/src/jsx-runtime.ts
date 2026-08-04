/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import {
  Fragment,
  jsx as reactJSX,
  jsxs as reactJSXS,
} from 'react/jsx-runtime';
import {
  createObservedJSXFunction,
  type JSXRuntimeFunction,
} from './ReactNativeElementObservation';

export { Fragment };
export const jsx = createObservedJSXFunction(
  reactJSX as JSXRuntimeFunction
) as typeof reactJSX;
export const jsxs = createObservedJSXFunction(
  reactJSXS as JSXRuntimeFunction
) as typeof reactJSXS;
