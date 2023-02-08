/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as ALSurface from "@hyperion/hyperion-autologging/src/Surface";

export type Props = {
  message: string,
  children?: React.ReactNode,
};

let SurfaceRenderer: ALSurface.ALSurfaceHOC = (props, render) => {
  return children => render ? render(children) : <>children</>;
}

export const Surface = (props: ALSurface.ALSurfaceProps) =>
  SurfaceRenderer(props, children => (
    <div style={{ border: '1px solid red', marginLeft: '5px' }}>
      <div style={{ color: 'red' }}>{props.surface}</div>
      {children}
    </div>
  ));

export function init(options: Parameters<typeof ALSurface.init>[0]) {
  SurfaceRenderer = ALSurface.init(options);
}
