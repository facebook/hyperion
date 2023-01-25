import React from "react";

export type Props = {
  message: string,
  children?: React.ReactNode,
};

type TSurfaceRenderer = (children: React.ReactNode) => React.ReactElement;
type TSurfaceProps = { surface: string };

// const SurfaceRenderer = ALSurface.init(AdsALFlowletManager);
function SurfaceRenderer(props: TSurfaceProps, render: TSurfaceRenderer): TSurfaceRenderer {
  return children => render(children);
}

export const Surface = (props: TSurfaceProps) =>
  SurfaceRenderer(props, children => (
    <div style={{ border: '1px solid red', marginLeft: '5px' }}>
      <div style={{ color: 'red' }}>{props.surface}</div>
      {children}
    </div>
  ));

