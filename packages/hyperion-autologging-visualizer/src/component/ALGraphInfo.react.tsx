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
.al-graph-main { grid-area: main; }
.al-graph-info { grid-area: info; }
`;

const ALGraphOptions = new LocalStoragePersistentData<{
  events: {
    al_ui_event: {
      click: boolean;
      change: boolean;
      [key: string]: boolean;
    };
    al_surface_mutation_event: {
      mount_component: boolean;
      unmount_component: boolean;
    };
    al_network_request: boolean;
    al_network_response: boolean;
  };
  nodes: {
    tuple: {
      page_uri: boolean;
      surface: boolean;
      component: boolean;
      text: boolean;
    };
    trigger_flowlet: boolean;
  };
  edges: {
    trigger: boolean;
    related_event_index: boolean;
    tuple: boolean;
  };
}>(
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
  value => JSON.parse(value),
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
            (values as Record<string, boolean>)[key] = checked;
            props.onChange(values);
          }} />
          : <span>{key}({
            Object.entries(value).map(([subkey, subvalue]) => <>
              <CheckboxInput key={key + "_" + subkey} label={subkey} checked={subvalue} onChange={checked => {
                (values as Record<string, Record<string, boolean>>)[key][subkey] = checked;
                props.onChange(values);
              }} />
              ,
            </>)
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

  const container = React.useRef<HTMLDivElement>(null);
  const gridContainer = React.useRef<HTMLDivElement>(null);
  const graphRef = React.useRef<{
    graph: ALGraph.ALGraph,
    channel: PausableChannel<AutoLogging.ALChannelEvent>,
  } | null>(null);

  const [elements, _setElements] = useState<cytoscape.ElementDefinition[]>([
    // Add any initial notes to the graph here
  ]);

  const [eventInfo, setEventInfo] = useState<ALGraph.EventInfos>();
  const [options, setOptions] = useState(ALGraphOptions.getValue());

  const renderer = props.renderer || (eventInfo => <pre>{eventInfo.eventName}</pre>);

  React.useEffect(
    () => {
      if (graphRef.current == null && container.current != null) {
        const cy = cytoscape({
          container: container.current,
          elements,
        });
        const graph = new ALGraph.ALGraph(
          cy,
          {
            onEventNodeClick: setEventInfo,
            filter: props.graphFilter,
            topContainer: gridContainer.current,
          }
        );
        const channel = new PausableChannel<AutoLogging.ALChannelEvent>();
        graphRef.current = { graph, channel };

        props.channel.pipe(channel);

        const alEvents = ALGraph.SupportedALEvents;

        alEvents.forEach(eventName => {
          switch (eventName) {
            case 'al_ui_event':
              channel.on(eventName).add(eventData => {
                if (options.events[eventName][eventData.event]) {
                  graph.addALUIEventNodeId(eventName, eventData);
                }
              });
              break;
            case 'al_surface_mutation_event':
              channel.on(eventName).add(eventData => {
                if (options.events[eventName][eventData.event]) {
                  graph.addSurfaceEvent(eventName, eventData);
                }
              });
              break;
            default:
              if (options.events[eventName]) {
                channel.on(eventName).add(eventData => {
                  graph.addALEventNodeId(eventName, eventData);
                });
              }
              break;
          }
        });
      }

      graphRef.current?.channel.unpause();
      return () => graphRef.current?.channel.pause();
    },
    [graphRef]
  );

  return (
    <div ref={gridContainer} style={{
      width: props.width || "100%",
      height: props.height || "1000px",
    }}>
      <style>{StyleCss}</style>
      <div className="al-graph-grid-container">
        <div className="al-graph-header"><center>Auto Logging Event Graph</center></div>
        <div className="al-graph-events">
          <MultiCheckboxInputs header="Events:" values={options.events} onChange={values => {
            options.events = values;
            ALGraphOptions.setValue(options);
            setOptions(options);
          }} />
        </div>
        <div className="al-graph-nodes">
          <MultiCheckboxInputs header="Nodes:" values={options.nodes} onChange={values => {
            options.nodes = values;
            ALGraphOptions.setValue(options);
            setOptions(options);
          }} />
        </div>
        <div className="al-graph-edges">
          <MultiCheckboxInputs header="Edges:" values={options.edges} onChange={values => {
            options.edges = values;
            ALGraphOptions.setValue(options);
            setOptions(options);
          }} />
        </div>
        <div className="al-graph-filter">Filter</div>
        <div className="al-graph-main" ref={container}></div>
        <div className="al-graph-info">{eventInfo != null ? renderer(eventInfo) : null}</div>
      </div>
    </div>
  );
}
