/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { ChangeEventHandler, useCallback, useState } from 'react';
import './App.css';
import DynamicSvgComponent from './component/DynamicSvgComponent';
import ElementNameComponent from './component/ElementNameComponent';
import LargeComp from './component/LargeComponent';
import NestedComponent from './component/NestedComponent';
import NonInteractiveSurfaceComponent from './component/NonInteractiveSurfaceComponent';
import ALEventLogger from './component/ALEventLogger';
import { LocalStoragePersistentData } from '@hyperion/hyperion-util/src/PersistentData';
import TestDivGrid from './component/TestDivGrid';
import ALGraphView from './component/ALGraphView';
import ResizableSplitView from "@hyperion/hyperion-autologging-visualizer/src/component/ResizableSplitView.react";
import { PortalBodyContainerComponent } from './component/PortalComponent';
import TextComponent from './component/TextComponent';
import RecursiveFuncComponent from './component/RecursiveFuncComponent';

function InitComp() {
  const [count, setCount] = React.useState(0);

  const handleClick = () => {
    setCount(count => {
      console.log('count is ', count);
      return count + 1;
    });
  };

  console.log('Re-rendering the InitComp');

  return (<div>
    <button onClick={handleClick}>Click!</button>
    <p>Click Count: {count}</p>
  </div>);
}

const maxDepth = 1000;
const Modes = {
  'mutationOnlySurface': () => <NonInteractiveSurfaceComponent></NonInteractiveSurfaceComponent>,
  'network': () => <DynamicSvgComponent></DynamicSvgComponent>,
  'nested': () => <>
    <div>
      {/* <Counter></Counter> */}
    </div>
    <div>
      <NestedComponent></NestedComponent>
      <LargeComp depth={1} maxDepth={maxDepth}></LargeComp>
    </div>
    <div>
      <PortalBodyContainerComponent message="Portal outside of Surface"></PortalBodyContainerComponent>
    </div>
    <div>
      <ElementNameComponent />
    </div>
    <TextComponent />
    <RecursiveFuncComponent i={3}></RecursiveFuncComponent>
  </>,
};
type ModeNames = keyof typeof Modes;
const PersistedOptionValue = new LocalStoragePersistentData<ModeNames>(
  'mode_drop_down',
  () => 'mutationOnlySurface',
  value => String(value),
  value => value in Modes ? value as ModeNames : 'mutationOnlySurface'
);

function App() {

  const [mode, setMode] = useState<ModeNames>(PersistedOptionValue.getValue());

  const onChange = useCallback<ChangeEventHandler<HTMLSelectElement>>((event) => {
    const value = event.target.value;
    if (value === 'mutationOnlySurface' || value === 'network' || value === 'nested') {
      PersistedOptionValue.setValue(value);
      setMode(value);
    }
  }, []);

  return (<ResizableSplitView direction='horizontal'
    content1={
      <div className='AppContent'>
        <label htmlFor='testSelector'>Select a mode:</label>
        <select onChange={onChange} value={mode} id='testSelector' aria-label='Mode Selector'>
          {Object.keys(Modes).map(key => <option key={key} value={key}>{key}</option>)}
        </select>
        {Modes[mode]()}
      </div>
    }

    content2={
      // <ResizableSplitView direction='vertical' content1="T2" content2="T3" style={{ backgroundColor: 'red' }}></ResizableSplitView>
      <>
      <ALGraphView />
      {/* <TestDivGrid /> */}
      {/* <ALEventLogger /> */}
      </>
    }
  />);


}

export default App;

{/* <h1>Large tree without interception:</h1>


        <InitComp></InitComp>

      <h1>Interception enabled</h1>


      <h1>Large tree with interception</h1>
      <LargeComp depth={1} maxDepth={maxDepth}></LargeComp> */}
