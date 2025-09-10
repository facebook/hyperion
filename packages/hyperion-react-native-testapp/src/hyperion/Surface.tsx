/**
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import * as AutoLoggingWrapper from './AutoLoggingWrapper';
import * as ALSurface from 'hyperion-autologging/src/ALSurface';

const getALSurfaceComponent = (): ALSurface.SurfaceComponent => {
  return AutoLoggingWrapper.getSurfaceComponent(
    ({ children }) => <View>{children}</View>
  );
};

export const Surface = (props: ALSurface.ALSurfaceProps) => {
  return (children: React.ReactNode) => {
    const ALSurfaceComponent = getALSurfaceComponent();
    return React.createElement(ALSurfaceComponent, props, children);
  };
};

export function SurfaceComp(props: React.PropsWithChildren<ALSurface.ALSurfaceProps & { style?: ViewStyle }>) {
  const { style, children, ...surfaceProps } = props;
  const ALSurfaceComponent = getALSurfaceComponent();

  const surfaceContent = React.createElement(ALSurfaceComponent, surfaceProps, children);

  return style ? <View style={style}>{surfaceContent}</View> : surfaceContent;
}
