/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";
import { Channel, PausableChannel } from "@hyperion/hyperion-channel";
import cytoscape from 'cytoscape';
import React, { useState } from "react";
import * as ALGraph from "./ALGraph";
import { LocalStoragePersistentData } from "@hyperion/hyperion-util/src/PersistentData";

const StyleCss = `
.al-graph-grid-container {
  display: grid;
  grid-template-areas:
    'header header header header header'
    'events events nodes nodes nodes'
    'events events edges edges edges'
    'filter filter filter filter filter'
    'control control control control control'
    'main main main main info';
  grid-template-columns: 20% 20% 20% 20% 20%;
  gap: 10px;
  padding: 10px;
  height: 100%;
}
.al-graph-grid-container > div {
  text-align: left;
  display: "inline-block";
  padding: 10px;
  border:1px solid black;
}
.al-graph-header { grid-area: header; text-align: center;}
.al-graph-events { grid-area: events; }
.al-graph-nodes { grid-area: nodes; }
.al-graph-edges { grid-area: edges; }
.al-graph-filter { grid-area: filter; }
.al-graph-control { grid-area: control; display: flex; justify-content: space-around; }
.al-graph-main { grid-area: main; }
.al-graph-info { grid-area: info; }

.al-graph-filter > input {width: 80%;}
`;


const ALGraphOptions = new LocalStoragePersistentData<ALGraph.ALGraphDynamicOptionsType>(
  'alGraphOptions',
  () => ({
    events: {
      al_ui_event: {
        click: true,
        change: false,
      },
      al_surface_mutation_event: {
        mount_component: false,
        unmount_component: false,
      },
      al_network_request: false,
      al_network_response: false,
      al_surface_visibility_event: {
        component_visible: false,
        component_hidden: false,
      },
    },
    nodes: {
      tuple: {
        page_uri: false,
        surface: false,
        component: false,
        text: false,
      },
      trigger_flowlet: false,
    },
    edges: {
      trigger: false,
      related_event_index: false,
      tuple: false,
    }
  }),
  value => JSON.stringify(value),
  value => {
    const options: ALGraph.ALGraphDynamicOptionsType = JSON.parse(value);
    // For now just patch the only missing item, but later make this generic
    try {
      if (typeof options?.events?.al_surface_visibility_event !== "object") {
        options.events.al_surface_visibility_event = {
          component_visible: false,
          component_hidden: false,
        };
      }
    } catch (e) {

    }
    return options;
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
      return <dd key={key}>{
        (typeof value === "boolean")
          ? <CheckboxInput label={key} checked={value} onChange={checked => {
            const newValues: T = {
              ...values,
              [key]: checked
            };
            props.onChange(newValues);
          }} />
          : <span>{key}({
            Object.entries(value).map(([subkey, subvalue]) =>
              <CheckboxInput key={key + "_" + subkey} label={subkey + ' , '} checked={subvalue} onChange={checked => {
                const newValues: T = {
                  ...values,
                };
                (newValues as Record<string, Record<string, boolean>>)[key][subkey] = checked;
                props.onChange(newValues);
              }} />
            )
          })</span>
      }
      </dd>
    })
  }</dl>;
}

export function ALGraphInfo(props: {
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
  const graphRef = React.useRef<{
    graph: ALGraph.ALGraph,
    channel: PausableChannel<AutoLogging.ALChannelEvent>,
  } | null>(null);

  const [elements, _setElements] = useState<cytoscape.ElementDefinition[]>([
    // Add any initial notes to the graph here
  ]);

  const [eventInfo, setEventInfo] = useState<ALGraph.EventInfos>();
  const [options, setOptions] = useState(ALGraphOptions.getValue());
  // const [instanceCounter, setInstanceCounter] = useState(0);

  options.filter ??= props.graphFilter;

  const renderer = props.renderer || (eventInfo => <pre>{eventInfo.eventName}</pre>);

  React.useEffect(
    () => {
      if (graphRef.current == null && graphContainer.current != null) {
        const graph = new ALGraph.ALGraph({
          onEventNodeClick: setEventInfo,
          topContainer: gridContainer.current,
          graphContainer: graphContainer.current,
          elements,
        });
        const channel = new PausableChannel<AutoLogging.ALChannelEvent>();
        graphRef.current = { graph, channel };

        props.channel.pipe(channel);

        const alEvents = ALGraph.SupportedALEvents;

        // In the following it is important to only close on graphNode from outside of this function.
        alEvents.forEach(eventName => {
          switch (eventName) {
            case 'al_ui_event':
              channel.on(eventName).add(eventData => {
                graphRef.current?.graph.addALUIEventNodeId(eventName, eventData);
              });
              break;
            case 'al_surface_mutation_event':
              channel.on(eventName).add(eventData => {
                graphRef.current?.graph.addSurfaceMutationEvent(eventName, eventData);
              });
              break;
            case 'al_surface_visibility_event':
              channel.on(eventName).add(eventData => {
                graphRef.current?.graph.addSurfaceVisibilityEvent(eventName, eventData);
              });
              break;
            default:
              channel.on(eventName).add(eventData => {
                graphRef.current?.graph.addALEventNodeId(eventName, eventData);
              });
              break;
          }
        });
      }

      graphRef.current?.channel.unpause();
      return () => graphRef.current?.channel.pause();
    },
    [graphRef, /* instanceCounter */]
  );

  React.useEffect(() => {
    if (graphRef.current) {
      // The following ensures that later the event handlers will see the latest value. 
      graphRef.current.graph.setDynamicOptions(options);
    }
  }, [options]);

  return (
    <div ref={gridContainer} style={{
      width: props.width || "99%",
      // height: props.height || "1000px",
    }}>
      <style>{StyleCss}</style>
      <div className="al-graph-grid-container">
        <div className="al-graph-header"><center>Auto Logging Event Graph</center></div>
        <div className="al-graph-events">
          <MultiCheckboxInputs header="Events:" values={options.events} onChange={values => {
            const newOptions = {
              ...options,
              events: values,
            };
            ALGraphOptions.setValue(newOptions);
            setOptions(newOptions);
          }} />
        </div>
        <div className="al-graph-nodes">
          <MultiCheckboxInputs header="Nodes:" values={options.nodes} onChange={values => {
            const newOptions = {
              ...options,
              nodes: values,
            };
            ALGraphOptions.setValue(newOptions);
            setOptions(newOptions);
          }} />
        </div>
        <div className="al-graph-edges">
          <MultiCheckboxInputs header="Edges:" values={options.edges} onChange={values => {
            const newOptions = {
              ...options,
              edges: values,
            };
            ALGraphOptions.setValue(newOptions);
            setOptions(newOptions);
          }} />
        </div>
        <div className="al-graph-filter">Filter:
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
          }} /></div>
        <div className="al-graph-control">

          <button
            onClick={() => {
              if (graphRef.current && graphContainer.current) {
                graphRef.current.graph = new ALGraph.ALGraph({
                  onEventNodeClick: setEventInfo,
                  topContainer: gridContainer.current,
                  graphContainer: graphContainer.current,
                  elements,
                });
                graphRef.current.graph.setDynamicOptions(options);
              }
              // setInstanceCounter(instanceCounter + 1);
            }}
          >
            Clear Graph
          </button>

          <button
            onClick={() => {
              graphRef.current?.graph.cy.fit();
            }}
          >
            Recenter & Fit Graph
          </button>

          <button
            onClick={() => {
              const cy = graphRef.current?.graph.cy;
              if (cy) {
                const blob = cy.png({ output: 'blob' });
                const blobURL = window.URL.createObjectURL(blob);
                window.open(blobURL);
              }
            }}
          >
            Take Graph Snapshot
          </button>
        </div>
        <div className="al-graph-main" ref={graphContainer} style={{ height: props.height }}></div>
        <div className="al-graph-info">{eventInfo != null ? renderer(eventInfo) : null}</div>
      </div>
    </div>
  );
}
