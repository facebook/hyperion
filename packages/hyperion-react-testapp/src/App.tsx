import React from 'react';
import logo from './logo.svg';
import './App.css';
import LargeComp from './component/LargeComponent';
import Counter from "./component/Counter";
import NestedComponent from './component/NestedComponent';
import * as IReact from "./IReact";

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

  return (
    <div className="App">
      <div>
        {/* <Counter></Counter> */}
      </div>
      <div>
        <NestedComponent></NestedComponent>
        <LargeComp depth={1} maxDepth={maxDepth}></LargeComp>
      </div>



    </div>
  );
}

export default App;

{/* <h1>Large tree without interception:</h1>
     

        <InitComp></InitComp>

      <h1>Interception enabled</h1>


      <h1>Large tree with interception</h1>
      <LargeComp depth={1} maxDepth={maxDepth}></LargeComp> */}