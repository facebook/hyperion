import React from "react";
import { interceptionStatus } from "./IReact";

class Timer {
  private startTime: number = performance.now();

  duration() {
    const stopTime = performance.now();
    return stopTime - this.startTime;
  }

}

interface DefaultProps {
  depth: number;
  maxDepth: number;
}

class ClassComponent extends React.Component<{ children: React.ReactNode }> {
  render() {
    return <span>{this.props.children}</span>
  }
}

let timer: Timer | null = null;
export function LargeComp(props: DefaultProps): React.ReactElement {
  const { depth } = props;
  const newDepth = props.depth + 1;
  if (depth === 1) {
    timer = new Timer();
    return <>
      <ClassComponent>{depth},{interceptionStatus}</ClassComponent>
      <LargeComp depth={newDepth} maxDepth={props.maxDepth}></LargeComp>
    </>

  } else if (props.depth > props.maxDepth) {
    return <div><b>time: {timer?.duration()}</b></div>;
  }

  return <>
    <ClassComponent>{null}</ClassComponent>
    <LargeComp depth={newDepth} maxDepth={props.maxDepth}></LargeComp>
  </>
}

export default function LargeComp2(props: DefaultProps) {
  const { depth, maxDepth } = props;
  const timer = new Timer();
  const children = Array(maxDepth);
  for (let i = 1; i < maxDepth; i++) {
    children.push(<ClassComponent key={i}> </ClassComponent>);
  }
  const duration = timer.duration();

  return <>
    <ClassComponent>{depth},{interceptionStatus},{maxDepth}</ClassComponent>
    {children}
    <div><b>time: {duration}</b></div>
  </>
}