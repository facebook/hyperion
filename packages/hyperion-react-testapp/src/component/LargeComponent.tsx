/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { interceptionStatus } from "../AutoLoggingWrapper";
import * as ALSurface from "hyperion-autologging/src/ALSurface";
import * as AutoLogging from "hyperion-autologging/src/AutoLogging";
import { LocalStoragePersistentData } from "hyperion-util/src/PersistentData";

type Comp = React.FC<React.PropsWithChildren<{ id: string, enableSurface?: boolean }>>;

const EnableSurface = new LocalStoragePersistentData<boolean>("enable-surface", () => false, (value) => value.toString(), (value) => value === "true", true);
const Surface: Comp = ({ children, id, enableSurface = EnableSurface.getValue() }) => {
  if (!enableSurface) {
    return children;
  }
  // return <span>{children}</span>
  return AutoLogging.getSurfaceRenderer()(
    {
      surface: id,
      capability: { trackMutation: true }
    }
  )(children);
}


const Cell: Comp = ({ children, id, enableSurface }) => {
  return (
    <td>
      <Surface id={id} enableSurface={enableSurface}>
        {children}
      </Surface>
    </td>
  );
};

const Row: Comp = ({ children, id, enableSurface }) => {
  return (
    <tr>
      {children}
    </tr >
  );
};

const Table: Comp = ({ children, id, enableSurface }) => {
  return (
    <div>
      <Surface id={id} enableSurface={enableSurface}>
        <table>
          <tbody>
            {children}
          </tbody>
        </table>
      </Surface>
    </div>
  );
};

function Box(props: React.PropsWithChildren<{ color: string }>): React.ReactElement {
  return (
    <div style={{ backgroundColor: props.color, border: "1px solid black" }}>
      {props.children}
    </div>
  );
}
const LargeTable: Comp = ({ id, enableSurface }): React.ReactElement => {
  const rows = 20;
  const columns = 150;
  const reportTimer = useTimer("LargeTable");

  const generateTableData = () => {
    const tableRows: React.ReactNode[] = [];

    for (let i = 0; i < rows; i++) {
      const cells: React.ReactNode[] = [];
      for (let j = 0; j < columns; j++) {
        const cellId = `${id}-cell-${i}-${j}`;
        cells.push(
          <Cell key={cellId} id={cellId} enableSurface={enableSurface}>.
            {/* Row {i + 1}, Col {j + 1} */}
          </Cell>
        );
      }
      const rowId = `${id}-row-${i}`;
      tableRows.push(
        <Row key={rowId} id={rowId} enableSurface={enableSurface}>
          {cells}
        </Row>
      );
    }

    return tableRows;
  };

  return (
    <Box color="lightblue">
      <h2>Large Table ({rows} rows × {columns} columns)</h2>
      <Table id={`table-${id}`} enableSurface={enableSurface}>
        {generateTableData()}
      </Table>
      {reportTimer.duration()}
      {reportTimer.final()}
    </Box>
  );
}

let timerId = 0;
class Timer {
  private startTime: number = performance.now();
  public readonly id = timerId++;
  duration() {
    const stopTime = performance.now();
    return Math.floor(stopTime - this.startTime);
  }

}

function useTimer(prefix: string): {
  duration: () => React.ReactElement;
  final: () => React.ReactElement;
} {
  const timer = new Timer();
  const ref = useRef<HTMLParagraphElement>(null);
  const getTime = () => `[${prefix}: {id: ${timer.id}, duration: ${timer.duration()}ms}]`;
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = `<b>${getTime()}</b>`;
    }
    console.log("timer", timer.id, timer.duration());
  }, []);
  return {
    duration: () => <div><i>{getTime()}</i></div>,
    final: () => <p ref={ref}></p>,
  }
}
type DefaultProps = React.PropsWithChildren<{
  depth: number;
  maxDepth: number;
}>;

function LargeComp1(props: DefaultProps): React.ReactElement {
  const { depth, maxDepth } = props;
  const newDepth = depth + 1;

  if (depth === 1) {
    return <div>
      <LargeComp1 depth={newDepth} maxDepth={maxDepth}></LargeComp1>
    </div>;
  } else
    if (depth < maxDepth) {
      return <>
        <Surface id={`large-comp1-${depth}`} >.{depth % 100 === 0 ? <br /> : null}</Surface>
        <LargeComp1 depth={newDepth} maxDepth={maxDepth}></LargeComp1>
      </>
    } else {
      return <></>;
    }

}

function LargeComp2(props: DefaultProps) {
  const { maxDepth } = props;
  const children = Array(maxDepth);
  for (let i = 1; i < maxDepth; i++) {
    children.push(<Surface key={i} id={`large-comp2-${i}`}>.{i % 100 === 0 ? <br /> : null}</Surface>);
  }

  return <div>{children}</div>
}

function LargeComp(props: React.PropsWithChildren<{
  color: string,
  name: string,
  comp: (props: DefaultProps) => React.ReactElement
}>): React.ReactElement {
  const { color } = props;
  const Comp = props.comp;
  const reportTimer = useTimer(props.name);
  return <Box color={color}>
    <Comp depth={1} maxDepth={1000} />
    {reportTimer.duration()}
    {reportTimer.final()}
  </Box>;
}


export default function LargeComponent(): React.ReactElement {
  const timer = new Timer();
  const [checked, setChecked] = useState(EnableSurface.getValue());
  const reportTimer = useTimer("LargeComponent");

  return <Box color="lightyellow">
    <div><label>Enable Surface: <input type="checkbox" checked={checked} onChange={() => {
      setChecked(!checked);
      EnableSurface.setValue(!checked);
      window.location.reload();
    }} /></label></div>
    <LargeComp name="LargeComp1-recursive" color="lightgreen" comp={LargeComp1} />
    <hr />
    <LargeComp name="LargeComp2-table" color="lightcoral" comp={LargeComp2} />
    <hr />
    <LargeTable id="large-table" enableSurface={checked} />
    {reportTimer.duration()}
    {reportTimer.final()}
  </Box>;
}
