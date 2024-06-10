/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
// import React, {useState, useCallback, useRef, useEffect} from "react";
import { IALFlowlet } from "@hyperion/hyperion-autologging/src/ALFlowletManager";
import { ALFlowletEventData } from "@hyperion/hyperion-autologging/src/ALFlowletPublisher";
import { AdsALHeartbeatEventData } from "@hyperion/hyperion-autologging/src/ALHeartbeat";
import { ALNetworkRequestEvent, ALNetworkResponseEvent } from "@hyperion/hyperion-autologging/src/ALNetworkPublisher";
import { ALSurfaceMutationEventData } from "@hyperion/hyperion-autologging/src/ALSurfaceMutationPublisher";
import { ALUIEventBubbleData, ALUIEventCaptureData, ALUIEventData } from "@hyperion/hyperion-autologging/src/ALUIEventPublisher";
import * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";
import type cytoscape from 'cytoscape';
import React from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import { getCytoscapeLayoutConfig } from "./CytoscapeLayoutConfig";
import * as ALGraph from "./ALGraph";


type BaseFlowlet = {
  id: number,
  name: string,
  fullName: string,
}

type CopiedFlowlet = BaseFlowlet & {
  data: {
    uiEventFlowlet: BaseFlowlet | null,
  }
} | null | undefined;

// TODO: abstract events through an interface?  Imagining an interface that has methods
// for deciding whether one event is linked to another, also what properties are useful / insightful etc...
type EventBody = {
  event: string,
  channelEventName?: string,
  flowlet?: IALFlowlet | null,
  copiedFlowlet?: CopiedFlowlet,
  targetElement?: HTMLElement | null,
} & (
    ALFlowletEventData |
    ALUIEventData |
    ALSurfaceMutationEventData |
    ALNetworkRequestEvent |
    ALNetworkResponseEvent |
    AdsALHeartbeatEventData |
    ALUIEventCaptureData |
    ALUIEventBubbleData);


// This may be useful if we want to use the underlying library more directly, although the component interface
// seems to provide enough knobs currently with access to cy object.
/**
function _ALSessionPetri(props: CyProps): React.JSX.Element {
  // If we have a need to try using cytoscape directly instead of through CytoscapeComponent
  const container = React.useRef(null);
  const cy = React.useRef<cytoscape.Core | null>(null);
  const layout = {...LAYOUT, ...CONFIG};
  React.useEffect(() => {
    cy.current = Cytoscape(
      {
        container: container.current,
        elements: props.elements,
        style: props.stylesheet,
        layout: layout,
      }
    );
  });

  React.useEffect(() => {
    cy.current?.layout(layout).run()
  }, [props.elements, cy]);
  return  <div id="cy"
            className="test"
            style={{height: props.height, width: props.width}}
            ref={(container)}></div>;
}
 */


type GraphData = cytoscape.ElementDefinition[];

function formatEventBuffer(events: Array<EventBody>, uiFlowlet: boolean = true, flowletFullName: boolean = true): GraphData {
  const elements: GraphData = [];
  const eventNodes: GraphData = [];
  let nodeId = 0;
  let flowletsSeen: Array<{ flowlet: string, flowletNodeId: number }> = [];
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    // Event node
    const eventName = event.channelEventName != null ? `${event.event}[${event.channelEventName}]` : event.event;
    const srcNode = {
      scratch: { _event: event },
      data: {
        color: ALGraph.nodeColor(eventName),
        id: String(nodeId++),
        label: eventName,
      }
    }
    elements.push(srcNode);
    // If flowlet insert flowlet parent node
    const flowlet = uiFlowlet ? event.copiedFlowlet?.data?.uiEventFlowlet : event.copiedFlowlet;
    if (flowlet != null) {
      const flowletName = flowletFullName ? flowlet.fullName : flowlet.name;
      if (!(flowletName === '/top' || flowletName === 'top')) {
        // We match to a previous flowlet,  add edge to parent
        const matchFlowlet = flowletsSeen.find((val) => flowletName.includes(val.flowlet));
        if (matchFlowlet) {
          elements.push(
            {
              data: {
                source: String(matchFlowlet.flowletNodeId),
                target: srcNode.data.id,
                color: ALGraph.edgeColor('flowlet'),
                label: matchFlowlet.flowletNodeId + '->' + srcNode.data.id,
              }
            }
          )
        }
        // Processing a new flowlet
        //else {
        const flowletParentId = nodeId++;
        flowletsSeen.push({ flowlet: flowletName, flowletNodeId: flowletParentId });
        // Flowlet node
        const flowletParent = {
          scratch: { _event: event },
          data: {
            color: ALGraph.nodeColor('parent'),
            id: String(flowletParentId),
            label: flowletName,
          }
        }
        elements.push(flowletParent);
        // Edge from src to flowlet parent
        elements.push(
          {
            data: {
              source: srcNode.data.id,
              target: String(flowletParentId),
              color: ALGraph.edgeColor('flowlet'),
              label: srcNode.data.id + '->' + flowletParentId,
            }
          }
        );
        const flowletParts = flowletName.split(/\/(?![^(]*\))/).filter(p => p != '');
        for (let k = 0; k < flowletParts.length; k++) {
          const nodeId = 'flowlet[' + flowletParentId + ']' + 'flowlet-part' + String(k);
          const previousNodeId = 'flowlet[' + flowletParentId + ']' + 'flowlet-part' + String(k - 1);
          elements.push(
            {
              scratch: { _event: flowlet },
              data: {
                parent: String(flowletParentId),
                color: ALGraph.nodeColor('flowlet-part'),
                id: nodeId,
                label: flowletParts[k],
              }
            }
          )
          if (k > 0) {
            // console.log('[PS] Part', flowletParts[k]);
            // add edge from previous
            elements.push(
              {
                data: {
                  source: previousNodeId,
                  target: nodeId,
                  color: ALGraph.edgeColor('seq'),
                  label: previousNodeId + '->' + nodeId,
                }
              }
            );
          }
        }
      }
    }
    // Even if flowlet is available assign a sequential edge to last of eventNodes
    if (eventNodes) {
      const node = eventNodes.at(-1);
      if (node) {
        elements.push(
          {
            data: {
              source: node.data.id,
              target: srcNode.data.id,
              color: ALGraph.edgeColor('seq'),
              label: node.data.id + '->' + srcNode.data.id,
            }
          }
        );
      }
    }
    eventNodes.push(srcNode);
  }

  return elements;
}


type CyProps = {
  graphTitle: string;
  height: string;
  width: string;
  elements: GraphData;
  stylesheet?: cytoscape.StylesheetStyle;
};

function ALSessionPetriReact(props: CyProps): React.JSX.Element {
  const [listenerRegistered, setListenerRegistered] = React.useState(false);
  const [hide, setHide] = React.useState(true);
  const cy = React.useRef<cytoscape.Core | null>(null);

  const setCytoscape = React.useCallback(
    (ref: cytoscape.Core) => {
      if (ref == null) {
        return;
      }
      cy.current = ref;
      cy.current?.layout(getCytoscapeLayoutConfig('klay')).run();
      if (!listenerRegistered) {
        cy.current?.on('click mouseover', 'node', (event) => {
          console.log('[PS]', event.type, event.target.data(), event.target.scratch());
        });
        cy.current?.on('click', 'edge', (event) => {
          console.log('[PS]', event.type, event.target.data(), event.target.scratch());
        });

        setListenerRegistered(true);
      }
    },
    [cy],
  );

  return <>
    <button onClick={() => setHide(!hide)}>{hide ? `Show ${props.graphTitle} Graph` : `Hide ${props.graphTitle} Graph`}</button>
    {!hide && (
      <>
        <button onClick={() => { const e = Math.random() * 100; cy.current?.add([{ data: { id: 'one' + String(e), label: 'Node ' + e }, position: { x: 0, y: 0 } }]) }}>Add Dummy Node</button>
        <CytoscapeComponent
          cy={setCytoscape}
          headless={false}
          stylesheet={props.stylesheet ?? ALGraph.defaultStylesheet}
          elements={props.elements}
          style={{ width: props.width, height: props.height }}
        />
      </>)}
  </>;
}


export function ALSessionGraph(): React.JSX.Element {
  const [eventBuffer, setEventBuffer] = React.useState<Array<EventBody>>([]);

  const addEvent = React.useCallback((event: EventBody): void => {
    setEventBuffer(eventBuffer => {
      // Skip clicks on the graph...
      if (event.targetElement != null && event.targetElement.nodeName === "CANVAS") {
        return eventBuffer;
      }
      // TODO: if we don't copy, then flowlet seems to continue mutating
      const { flowlet, ...data } = event;
      let copied: EventBody = ({
        ...data,
        ...{
          copiedFlowlet: (event.flowlet != null ? {
            name: event.flowlet.name,
            fullName: event.flowlet?.getFullName(),
            id: event.flowlet.id,
            data: event.flowlet.data.uiEventFlowlet != null ? {
              uiEventFlowlet: {
                id: event.flowlet.data.uiEventFlowlet.id,
                name: event.flowlet.data.uiEventFlowlet.name,
                fullName: event.flowlet.data.uiEventFlowlet.getFullName(),
              }
            } : { uiEventFlowlet: null }
          } : undefined)
        },
      } as EventBody);
      return [...eventBuffer, copied];
    })
  }, []);

  React.useEffect(() => {
    // Set up listeners
    const removeListeners: Array<() => void> = [];
    const options = AutoLogging.getInitOptions();
    const uiChannel = options.channel;
    const uiEvents: Array<'al_ui_event' | 'al_ui_event_capture' | 'al_ui_event_bubble'> = [
      'al_ui_event',
      // Pretty noisy,  but may be useful to debug
      // 'al_ui_event_capture',
      // 'al_ui_event_bubble',
    ];
    uiEvents.forEach(eventName => {
      const listener = uiChannel?.on(eventName).add(e => addEvent({ ...e, channelEventName: eventName }));
      if (listener) {
        removeListeners.push(
          () => uiChannel?.removeListener(eventName, listener)
        );
      }
    });
    const surfaceChannel = options.channel;
    const surfaceListener = surfaceChannel?.on('al_surface_mutation_event').add(addEvent);
    if (surfaceListener) {
      removeListeners.push(
        () => surfaceChannel?.removeListener('al_surface_mutation_event', surfaceListener)
      );
    }
    const heartbeatChannel = options.channel;
    const heartbeatListener = heartbeatChannel?.on('al_heartbeat_event').add(addEvent);
    if (heartbeatListener) {
      removeListeners.push(
        () => heartbeatChannel?.removeListener('al_heartbeat_event', heartbeatListener)
      );
    }
    // With this enabled,  there's like an infinite loop of interception and emitting events /then/then/then/then/then/then/then/then/then/then/....
    // const flowletChannel = options.flowletPublisher?.channel;
    // const flowletListener = flowletChannel?.on('al_flowlet_event').add(e => addEvent({event: "flowlet_init", ...e}));
    // if (flowletListener) {
    //   removeListeners.push(
    //     () => flowletChannel?.removeListener('al_flowlet_event', flowletListener)
    //   );
    // }
    const networkChannel = options.channel;
    const networkEvents: Array<'al_network_request' | 'al_network_response'> = [
      'al_network_request',
      'al_network_response',
    ];
    networkEvents.forEach(eventName => {
      const listener = networkChannel?.on(eventName).add(addEvent);
      if (listener) {
        removeListeners.push(
          () => networkChannel?.removeListener(eventName, listener)
        );
      }
    })

    // Remove registered listeners
    return () => removeListeners.forEach(rm => rm());
  }, [addEvent]);

  return (
    <div style={{ width: "100%", display: "inline-block" }}>
      {/* <div style={{textAlign:"left", float:"left", width: "50px"}}>
        <pre>{JSON.stringify(eventBuffer.map((e, i) => {return {id: i, ev: e.event};}), undefined, 2)}</pre>
      </div> */}
      <div style={{ textAlign: "left" }}>
        <ALSessionPetriReact
          graphTitle={'Flowlet (Non UI)'}
          height={'200px'}
          width={'100%'}
          elements={formatEventBuffer(eventBuffer, false, true)} />
        <br />
        <ALSessionPetriReact
          graphTitle={'UI Flowlet'}
          height={'200px'}
          width={'100%'}
          elements={formatEventBuffer(eventBuffer, true, true)} />
        {/* <_ALSessionPetri
          height={'200px'}
          width={'100%'}
          stylesheet={defaultStylesheet}
          elements={formatEventBuffer(eventBuffer)} /> */}
      </div>
    </div>
  );
}
