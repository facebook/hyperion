/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from 'react';
import { useState } from 'react';
import ClassComponent from './ClassComponent';
import FuncComponent from './FuncComponent';
import { PortalBodyContainerComponent, PortalComponent } from './PortalComponent';
import { SurfaceComp } from './Surface';

export default function (_props: {}): React.ReactElement {
  console.log('Root render');
  const [count, setCount] = useState(0);
  return (
    <SurfaceComp surface='S1'>
      <div>S1</div>
      <SurfaceComp surface='R1' isHiddenRegion={true}>
        <div>R1</div>
        <SurfaceComp surface='S2'>
          <div>/S1/S2</div>
          <SurfaceComp surface='R2' isHiddenRegion={true}>
            <div>/S1/R1/S2/R2</div>
          </SurfaceComp>
        </SurfaceComp>
      </SurfaceComp>
    </SurfaceComp>
  );
}
