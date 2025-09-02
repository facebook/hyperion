/**
 * React Native Surface Implementation
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import * as AutoLoggingWrapper from './AutoLoggingWrapper';
import type * as RNSurface from 'hyperion-autologging/src/RNSurface';

const getRNSurfaceComponent = (): RNSurface.RNSurfaceComponent => {
  return AutoLoggingWrapper.getSurfaceComponent(
    ({ children }) => <View>{children}</View>
  );
};

export const Surface = (props: RNSurface.RNSurfaceProps) => {
  return (children: React.ReactNode) => {
    const RNSurfaceComponent = getRNSurfaceComponent();
    return React.createElement(RNSurfaceComponent, props, children);
  };
};

export function SurfaceComp(props: React.PropsWithChildren<RNSurface.RNSurfaceProps & { style?: ViewStyle }>) {
  const { style, children, ...surfaceProps } = props;
  const RNSurfaceComponent = getRNSurfaceComponent();

  const surfaceContent = React.createElement(RNSurfaceComponent, surfaceProps, children);

  return style ? <View style={style}>{surfaceContent}</View> : surfaceContent;
}

export type { RNSurfaceProps, RNSurfaceCapability } from 'hyperion-autologging/src/RNSurface';
