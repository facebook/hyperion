/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import * as AutoLogging from "hyperion-autologging/src/AutoLogging";
import { Channel } from "hyperion-channel";
import { LocalStoragePersistentData } from "hyperion-util/src/PersistentData";
import cytoscape from 'cytoscape';
import React, { useState } from "react";
import * as ALGraph from "./ALGraph";
import ResizableSplitViewReact from "./ResizableSplitView.react";

const StyleCss = `
.al-graph-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
  width: 100%;
}

// .al-graph-container > div {
//   margin: 10px;
//   text-align: center;
// }

.al-graph-container-header {
  flex: 0 1 0%;
  /* The above is shorthand for:
  flex-grow: 0,
  flex-shrink: 1,
  flex-basis: ?%
  */
  padding: 5px;
}

.al-graph-container-content {
  flex: 1 1 auto;
  resize: horizontal;
  overflow: auto;
}

.al-graph-container-footer {
  flex: 0 1 0%;
}

.al-graph-control {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.al-graph-options {
  display: grid;
  grid-template-areas:
    'events events nodes nodes nodes'
    'events events edges edges edges'
    'filter filter filter filter filter';
  grid-template-columns: 20% 20% 20% 20% 20%;
  grid-template-rows: repeat(2, fit-content(40%)) auto;
  gap: 5px;
  padding: 10px;
  // height: 100%;
}
.al-graph-options > div {
  text-align: left;
  display: "inline-block";
  padding: 5px;
  border:1px solid black;
}
.al-graph-options-events { grid-area: events; }
.al-graph-options-nodes { grid-area: nodes; }
.al-graph-options-edges { grid-area: edges; }
.al-graph-options-filter { grid-area: filter; }
.al-graph-options-filter > input {width: 80%;}

// .al-graph-main { grid-area: main; }
// .al-graph-info { grid-area: info; }
.al-graph-main-content { width: 100%; height: 100%}
.al-graph-main-info { height: 100%}
`;

const ALGraphOptions = new LocalStoragePersistentData<ALGraph.ALGraphDynamicOptionsType>(
  'alGraphOptions',
  () => ALGraph.ALGraphDefaultDynamicOptions,
  value => JSON.stringify(value),
  value => {
    /**
     * If we change the structure of the options, we want to make sure all clients are updated
     * to the latest setup, so, we need to reet their values. We can do that when we parse the
     * stored value.
     */
    const options: ALGraph.ALGraphDynamicOptionsType = JSON.parse(value);
    const currentVersion = typeof options?.version === 'number' ? options.version : 0;
    if (currentVersion < ALGraph.ALGraphDefaultDynamicOptions.version) {
      return ALGraph.ALGraphDefaultDynamicOptions;
    } else {
      return options;
    }
  }
)

function CheckboxInput(props: {
  label: string;
  checked?: boolean;
  onChange: (value: boolean) => void;
}): React.JSX.Element {
  const [checked, setChecked] = React.useState<boolean>(props.checked || false);
  const onChange = React.useCallback((_event: React.ChangeEvent) => {
    const newValue = !checked;
    props.onChange(newValue);
    setChecked(newValue);
  }, [props.onChange, checked]);

  const id: string = `al_graph_id_${props.label.replace(" ", "_")}`;
  return <span>
    <input type="checkbox" id={id} onChange={onChange} defaultChecked={checked}></input>
    <label htmlFor={id}>{props.label}</label>
  </span>;
}

function MultiCheckboxInputs<T extends Record<string, boolean | Record<string, boolean>>>(props: {
  header: string;
  values: T;
  onChange: (values: T) => void;
}): React.JSX.Element {
  const values = props.values;
  return <dl><dt>{props.header}</dt>{
    Object.entries(values).map(([key, value]) => {
      let optionImplementation;
      switch (typeof value) {
        case "boolean":
          optionImplementation = <CheckboxInput label={key} checked={value} onChange={checked => {
            const newValues: T = {
              ...values,
              [key]: checked
            };
            props.onChange(newValues);
          }} />;
          break;
        case "object":
          optionImplementation = <MultiCheckboxInputs header={key} values={value} onChange={subValues => {
            const newValues: T = {
              ...values,
              [key]: subValues
            };
            props.onChange(newValues);
          }} />;
          break;
        default:
          optionImplementation = <span>Invalid Option Value type {typeof value}</span>;
          break;
      }
      return <dd key={key}>{optionImplementation}</dd>
    })
  }</dl>;
}

export function ALGraphInfo(props: {
  graphTitle?: string,
  channel: Channel<AutoLogging.ALChannelEvent>,
  height: string,
  width: string,
  renderer?: (eventInfo: ALGraph.EventInfos) => React.JSX.Element,
  graphFilter?: string,
}): React.JSX.Element {
  /**
   * NOTE: Using the CytoscapeComponent did not work for this approach that
   * uses a dynamic approach to update the graph. That component seems to
   * keep changing the instance of the graph behind the scene
   */

  const gridContainer = React.useRef<HTMLDivElement>(null);
  const graphContainer = React.useRef<HTMLDivElement>(null);
  const graphRef = React.useRef<ALGraph.ALGraph | null>(null);

  const [elements, _setElements] = useState<cytoscape.ElementDefinition[]>([
    // Add any initial notes to the graph here
  ]);

  const [eventInfo, setEventInfo] = useState<ALGraph.EventInfos>();
  const [options, setOptions] = useState(ALGraphOptions.getValue());
  const [showMenu, setShowMenu] = useState(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  options.filter ??= props.graphFilter;

  const graphTitle = props.graphTitle ?? "Auto Logging Event Graph";

  const renderer = props.renderer || (eventInfo => <pre>{eventInfo.eventName}</pre>);

  React.useEffect(
    () => {
      if (graphRef.current == null && graphContainer.current != null) {
        const graph = new ALGraph.ALGraph({
          onNodeClick: { event: setEventInfo },
          topContainer: gridContainer.current,
          graphContainer: graphContainer.current,
          elements,
          channel: props.channel,
        });
        graphRef.current = graph;
      }

      graphRef.current?.unpause();
      return () => graphRef.current?.pause();
    },
    [graphRef]
  );

  React.useEffect(() => {
    if (graphRef.current) {
      // The following ensures that later the event handlers will see the latest value.
      graphRef.current.setDynamicOptions(options);
    }
  }, [options]);

  return (
    <div ref={gridContainer} style={{
      width: props.width || "99%",
      height: props.height || "1000px",
    }}>
      <style>{StyleCss}</style>
      <div className="al-graph-container">
        <div className="al-graph-container-header">
          <div className="al-graph-control">
            <a onClick={() => { setShowMenu(!showMenu); }} style={{ cursor: "pointer" }} title={(showMenu ? "Hide" : "Show") + " Options"}>
              <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
                <path d="M4 18L20 18" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12L20 12" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 6L20 6" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </a>
            <center>{graphTitle}</center>
            <button
              onClick={() => {
                setEventInfo(void 0);
                graphRef.current?.clearGraph();
              }}
            >
              Clear Graph
            </button>

            <button
              onClick={() => {
                graphRef.current?.fitGraph();
              }}
            >
              Recenter & Fit Graph
            </button>

            <button
              onClick={() => {
                isPaused
                  ? graphRef.current?.unpause()
                  : graphRef.current?.pause();
                setIsPaused(!isPaused);
              }}
            >
              {isPaused ? "Unpause" : "Pause"} Graph
            </button>

            <button
              onClick={() => {
                graphRef.current?.takeSnapshot();
              }}
            >
              Take Graph Snapshot
            </button>
          </div>
          <div className="al-graph-options" style={{ display: showMenu ? 'grid' : 'none' }}>
            <div className="al-graph-options-events">
              <MultiCheckboxInputs header="Events:" values={options.events} onChange={values => {
                const newOptions = {
                  ...options,
                  events: values,
                };
                ALGraphOptions.setValue(newOptions);
                setOptions(newOptions);
              }} />
            </div>
            <div className="al-graph-options-nodes">
              <MultiCheckboxInputs header="Nodes:" values={options.nodes} onChange={values => {
                const newOptions = {
                  ...options,
                  nodes: values,
                };
                ALGraphOptions.setValue(newOptions);
                setOptions(newOptions);
              }} />
            </div>
            <div className="al-graph-options-edges">
              <MultiCheckboxInputs header="Edges:" values={options.edges} onChange={values => {
                const newOptions = {
                  ...options,
                  edges: values,
                };
                ALGraphOptions.setValue(newOptions);
                setOptions(newOptions);
              }} />
            </div>
            <div className="al-graph-options-filter">Filter:
              <a href="https://js.cytoscape.org/#selectors" target="_blank" style={{
                "color": "#fff",
                "backgroundColor": "#feb22a",
                "width": "12px",
                "height": "12px",
                "display": "inline-block",
                "borderRadius": "100%",
                "fontSize": "10px",
                "textAlign": "center",
                "textDecoration": "none",
                "boxShadow": "inset -1px -1px 1px 0px rgba(0,0,0,0.25)",

              }}>?</a>
              <input type='text' defaultValue={options.filter} onChange={value => {
                const newOptions = {
                  ...options,
                  filter: value.target.value,
                };
                ALGraphOptions.setValue(newOptions);
                setOptions(newOptions);
              }} />
            </div>
          </div>
        </div>
        <ResizableSplitViewReact direction="horizontal" className="al-graph-container-content" style={{ height: "95%" }}
          content1={<div className="al-graph-main-content" ref={graphContainer}></div>}
          content2={<div className="al-graph-main-info">{eventInfo != null ? renderer(eventInfo) : null}</div>}
        />
        {/* <div className="al-graph-container-footer">Footer</div> */}
      </div>
    </div>
  );
}
