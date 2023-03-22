/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from 'react';
import { useState } from 'react';
import ClassComponent from './ClassComponent';
import ForwardRefComponent from './ForwardRefComponent';
import FuncComponent from './FuncComponent';
import {PortalBodyContainerComponent, PortalComponent} from './PortalComponent';
import { Props, Surface } from './Surface';
import { ToggleSurfaceComponent } from './ToggleSurfaceComponent';
import { InputSurfaceComponent } from './InputSurfaceComponent';

class EmptyClassComponent extends React.Component<{}> {
  render(): React.ReactElement {
    return <></>;
  }
}

function EmptyFuncComponent() {
  return <></>;
}

function IndirectSurface(props: Props) {
  return Surface({ surface: 'indirect-surface' })(
    <>
      {props.children}
      <span>{props.message}</span>
    </>,
  );
}

export default function AdsSpeedLabAutoLoggingImpl(_props: {}): React.ReactElement {
  console.log('Root render');
  const [count, setCount] = useState(0);
  return Surface({ surface: 'RootComp' })(
    <div data-comptype="root">
      <p>Auto Logging Example</p>
      <FuncComponent message={`1st comp: ${count}`}>
        <ClassComponent message={`2nd comp: ${count}`} />
        {Surface({ surface: 'LocalSub' })(
          <>
            <ClassComponent message="nested surface" />
            <PortalComponent message='This is portal'></PortalComponent>
            <PortalBodyContainerComponent message='This is portal contained in document.body'></PortalBodyContainerComponent>
          </>
        )}
        {Surface({ surface: 'TestPortal' })(
          <PortalBodyContainerComponent message='This is portal contained in document.body wrapped in surface'></PortalBodyContainerComponent>
        )}
      </FuncComponent>
      <p>
        <button onClick={() => setCount(count + 1)}>Trigger Refresh</button>
        <EmptyFuncComponent />
        <EmptyClassComponent {...{}} />
      </p>
      <ForwardRefComponent message="forwarding ref" />
      <IndirectSurface message="indirect">
        <span>Indirect-child</span>
      </IndirectSurface>
      <ToggleSurfaceComponent/>
      <InputSurfaceComponent />
    </div>,
  );
}
