/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as ALSurface from "hyperion-autologging/src/ALSurface";
import * as ALSurfaceTypes from "hyperion-autologging/src/ALSurfaceTypes";
import * as AutoLogging from "hyperion-autologging/src/AutoLogging";
import * as React from "react";

export type Props = {
  message: string,
  children?: React.ReactNode,
};

let SurfaceRenderer: ALSurfaceTypes.ALSurfaceHOC = (props, render) => {
  return children => render ? render(children) : <>{children}</>;
}

export const Surface = (props: React.PropsWithChildren<ALSurfaceTypes.ALSurfaceProps>) => {
  if (!props.capability?.trackVisibilityThreshold) {
    props = {
      ...props,
      capability: {
        trackVisibilityThreshold: .5,
        ...props.capability,
        // trackMutation: false,
      }
    }
  }
  return children => <ALSurface.Surface {...props} >
    <div style={{ border: '1px solid red', marginLeft: '5px' }}>
      <div style={{ color: props.capability?.nonInteractive ? 'blue' : 'red' }}>{props.surface}</div>
      {children}
    </div>
  </ALSurface.Surface>;
}

export function SurfaceComp(props: React.PropsWithChildren<ALSurfaceTypes.ALSurfaceProps>) {
  return Surface(props)(props.children);
}

export function SimpleSurface(props: React.PropsWithChildren<ALSurfaceTypes.ALSurfaceProps>) {
  if (!props.capability?.trackVisibilityThreshold) {
    props = {
      ...props,
      capability: {
        trackVisibilityThreshold: .5,
        ...props.capability,
        // trackMutation: false,
      }
    }
  }
  return <ALSurface.Surface {...props}>{props.children}</ALSurface.Surface>;
}
