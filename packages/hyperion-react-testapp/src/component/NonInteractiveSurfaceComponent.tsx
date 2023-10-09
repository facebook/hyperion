/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { ALSurfaceCapability } from "@hyperion/hyperion-autologging/src/ALSurface";
import * as React from 'react';
import { useState, useRef } from 'react';
import { SurfaceComp } from './Surface';

export default function (_props: {}): React.ReactElement {
  console.log('Root render');
  const [count, setCount] = useState(0);
  const refR2 = useRef(null)
  const EMPTY_REF = {current: null};

  return (
    <SurfaceComp surface='S1'>
      <div>S1</div>
      <SurfaceComp surface='R1' capability={ALSurfaceCapability.TrackMutation} nodeRef={EMPTY_REF}>
        <div>R1</div>
        <SurfaceComp surface='S2'>
          <div>/S1/S2</div>
          <SurfaceComp surface='R2' capability={ALSurfaceCapability.TrackMutation} nodeRef={refR2}>
            <div ref={refR2}>/S1/R1/S2/R2</div>
          </SurfaceComp>
        </SurfaceComp>
      </SurfaceComp>
    </SurfaceComp>
  );
}
