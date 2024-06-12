/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";
import { Channel, PausableChannel } from "@hyperion/hyperion-channel";
import cytoscape from 'cytoscape';
import React, { useState } from "react";
import * as ALGraph from "./ALGraph";

export function ALGraphInfo(props: {
  channel: Channel<AutoLogging.ALChannelEvent>,
  height: string,
  width: string,
  renderer: (eventInfo: ALGraph.EventInfos) => React.JSX.Element,
}): React.JSX.Element {
  /**
   * NOTE: Using the CytoscapeComponent did not work for this approach that
   * uses a dynamic approach to update the graph. That component seems to
   * keep changing the instance of the graph behind the scene
   */

  const container = React.useRef<HTMLDivElement>(null);
  const graphRef = React.useRef<{
    graph: ALGraph.ALGraph,
    channel: PausableChannel<AutoLogging.ALChannelEvent>,
  } | null>(null);

  const [elements, _setElements] = useState<cytoscape.ElementDefinition[]>([
    // Add any initial notes to the graph here
  ]);

  const [eventInfo, setEventInfo] = useState<ALGraph.EventInfos>();
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
            onEventNodeClick: setEventInfo
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
                graph.addALUIEventNodeId(eventName, eventData);
              });
              break;
            case 'al_surface_mutation_event':
              channel.on(eventName).add(eventData => {
                graph.addSurfaceEvent(eventName, eventData);
              });
              break;
            default:
              channel.on(eventName).add(eventData => {
                graph.addALEventNodeId(eventName, eventData);
              });
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
    <table style={{
      width: props.width || "100%",
      height: props.height || "1000px",
    }}>
      <tbody>
        <tr>
          <th>Graph</th>
          <th>Info</th>
        </tr>
        <tr>
          <td width="80%">
            <div
              style={{
                width: "100%",
                height: "100%",
                textAlign: "left",
                display: "inline-block",
                borderBlockStyle: 'groove',
                borderBlockColor: 'red'
              }}
              ref={container}></div>
          </td>
          <td>
            <div
              style={{
                width: "100%",
                height: "100%",
                textAlign: "left",
                display: "inline-block",
                borderBlockStyle: 'groove',
                borderBlockColor: 'green'
              }}
            >{eventInfo != null ? renderer(eventInfo) : null}</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
