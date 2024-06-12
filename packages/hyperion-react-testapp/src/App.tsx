/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { ChangeEventHandler, useCallback, useState } from 'react';
import './App.css';
import LargeComp from './component/LargeComponent';
import Counter from "./component/Counter";
import NestedComponent from './component/NestedComponent';
import { PortalBodyContainerComponent } from './component/PortalComponent';
import DynamicSvgComponent from './component/DynamicSvgComponent';
import ElementNameComponent from './component/ElementNameComponent';
import TextComponent from './component/TextComponent';
import RecursiveRuncComponent from "./component/RecursiveFuncComponent";
import { ElementTextTooltip } from "@hyperion/hyperion-autologging-visualizer/src/component/ElementTextTooltip.react";
import { SyncChannel } from './Channel';
import NonInteractiveSurfaceComponent from './component/NonInteractiveSurfaceComponent';
import ALEventLogger from './component/ALEventLogger';
import { LocalStoragePersistentData } from '@hyperion/hyperion-util/src/PersistentData';

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
    <RecursiveRuncComponent i={3}></RecursiveRuncComponent>
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

  return (
    <div className="App">
      <ALEventLogger />
      <label htmlFor='testSelector'>Select a mode:</label>
      <select onChange={onChange} value={mode} id='testSelector' aria-label='Mode Selector'>
        {Object.keys(Modes).map(key => <option key={key} value={key}>{key}</option>)}
      </select>
      {Modes[mode]()}
    </div>
  );
}

export default App;

{/* <h1>Large tree without interception:</h1>


        <InitComp></InitComp>

      <h1>Interception enabled</h1>


      <h1>Large tree with interception</h1>
      <LargeComp depth={1} maxDepth={maxDepth}></LargeComp> */}
