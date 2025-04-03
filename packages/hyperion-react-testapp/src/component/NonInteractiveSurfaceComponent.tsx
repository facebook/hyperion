/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from 'react';
import { useState, useRef } from 'react';
import { SimpleSurface, SurfaceComp } from './Surface';

export default function (_props: {}): React.ReactElement {
  console.log('Root render');
  const [count, setCount] = useState(0);
  const refR2 = useRef(null)
  const EMPTY_REF = { current: null };

  return (
    <SurfaceComp surface='S1'>
      <div>S1</div>
      <SurfaceComp surface='R1' capability={{ nonInteractive: true }} nodeRef={EMPTY_REF}>
        <div>R1 (will not be tracked)</div>
        <SurfaceComp surface='S2'>
          <div>/S1/S2</div>
          <SurfaceComp surface='R2' capability={{ nonInteractive: true }} nodeRef={refR2}>
            <div ref={refR2}>/S1/R1/S2/R2</div>
            <SimpleSurface surface="S3">
              <SimpleSurface surface="S4">
                <SurfaceComp surface="R3" capability={{ nonInteractive: true }}>
                  <div>/S1/R1/S2/R2/S3/S4/R3</div>
                </SurfaceComp>
              </SimpleSurface>
            </SimpleSurface>
          </SurfaceComp>
        </SurfaceComp>
      </SurfaceComp>
    </SurfaceComp>
  );
}
