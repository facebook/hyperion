/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { ChangeEventHandler, useCallback, useState } from 'react';
import logo from './logo.svg';
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
import { ALSessionGraph } from "@hyperion/hyperion-autologging-visualizer/src/component/ALSessionGraph.react";
import RegionComponent from './component/RegionComponent';

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

function App() {
  const maxDepth = 1000;

  const Modes = {
    'region': () => <RegionComponent></RegionComponent>,
    'network': () => <DynamicSvgComponent></DynamicSvgComponent>,
    'nested': () => <ElementTextTooltip channel={SyncChannel}>
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
      <DynamicSvgComponent></DynamicSvgComponent>
      <TextComponent />
      <RecursiveRuncComponent i={3}></RecursiveRuncComponent>
      <RegionComponent></RegionComponent>
    </ElementTextTooltip>,
  };
  const [mode, setMode] = useState<keyof typeof Modes>('region');

  const onChange = useCallback<ChangeEventHandler<HTMLSelectElement>>((event) => {
    const value = event.target.value;
    if (value === 'region' || value === 'network' || value === 'nested') {
      setMode(value);
    }
  }, []);

  return (
    <div className="App">
      <ALSessionGraph />
      <label>Select a mode:</label>
      <select onChange={onChange} value={mode}>
        {Object.keys(Modes).map(key => <option value={key}>{key}</option>)}
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
