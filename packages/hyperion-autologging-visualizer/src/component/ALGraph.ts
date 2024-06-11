/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
// import React, {useState, useCallback, useRef, useEffect} from "react";
import { ALFlowletEvent } from '@hyperion/hyperion-autologging/src/ALType';
import { ALChannelEvent } from '@hyperion/hyperion-autologging/src/AutoLogging';
import { Flowlet } from '@hyperion/hyperion-flowlet/src/Flowlet';
import { Nullable } from '@hyperion/hyperion-util/src/Types';
import type cytoscape from 'cytoscape';
import { getCytoscapeLayoutConfig } from './CytoscapeLayoutConfig';

export const defaultStylesheet: cytoscape.Stylesheet[] = [
  {
    selector: 'node', css: {
      'shape': 'rectangle',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'width': '100px',
      'text-wrap': 'ellipsis',
      'text-max-width': '95px',
      'text-overflow-wrap': 'whitespace',
      'font-weight': 'lighter',
      'font-size': '5',
    }
  },
  {
    selector: "node[color]", style: {
      'background-color': 'data(color)',
    }
  },
  {
    selector: ':parent', css: {
      'background-color': 'white',
      'text-valign': 'top',
      'text-halign': 'center',
      'shape': 'round-rectangle',
      //@ts-ignore
      'corner-radius': "10",
      'padding': 10,
    }
  },
  {
    selector: 'edge', style: {
      'width': 3,
      // 'line-color': 'data(color)',
      // 'target-arrow-color': 'data(color)',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier'
    }
  },
  {
    selector: 'edge[color]', style: {
      "line-color": 'data(color)',
      'target-arrow-color': 'data(color)',
    }
  },
  {
    selector: 'edge.flowlet', style: {
      "line-color": 'LightCyan',
      'target-arrow-color': 'PaleTurquoise',
      "width": '2',
    }
  },
  {
    selector: 'edge.related', style: {
      "line-style": 'dotted',
      "width": '2',
    }
  },
  {
    selector: '.al_ui_event', style: {
      "background-color": 'green'
    }
  },
  {
    selector: '.al_surface_mutation_event.mount_component', style: {
      "background-color": 'blue'
    }
  },
  {
    selector: '.al_surface_mutation_event.unmount_component', style: {
      "background-color": 'pink'
    }
  },
  {
    selector: '.al_heartbeat_event', style: {
      "background-color": 'red'
    }
  },
  {
    selector: '.al_network_request', style: {
      "background-color": 'gold'
    }
  },
  {
    selector: '.al_network_response', style: {
      "background-color": 'yellow'
    }
  },
  {
    selector: '.flowlet', style: {
      "background-color": 'cyan'
    }
  },

];

type GraphID = string | undefined;

export const SupportedALEvents = [
  'al_ui_event',
  'al_surface_mutation_event',
  // 'al_heartbeat_event', // causes un-necessary re-layout
  'al_network_request',
  'al_network_response',
] as const;

type SupportedALEventNames = (typeof SupportedALEvents)[number] & (keyof ALChannelEvent); // & to filter out typos in the list
type SupportedALEventData<T extends SupportedALEventNames> = ALChannelEvent[T][0] & Partial<Nullable<ALFlowletEvent>>;

export class ALGraph {
  layout: cytoscape.Layouts;
  constructor(public readonly cy: cytoscape.Core) {
    this.layout = cy.layout(getCytoscapeLayoutConfig('klay'));
    this.layout.run();
    cy.style(defaultStylesheet);
    // click handlers with callback HOOKs?
  }

  private addNode(node: cytoscape.NodeDefinition): typeof node {
    this.cy.add(node);
    return node;
  }

  private addEdge(sourceId: GraphID, targetId: GraphID, classes?: string | string[]): cytoscape.EdgeDefinition | null {
    if (!sourceId || !targetId) {
      return null;
    }
    const edge: cytoscape.EdgeDefinition = {
      group: 'edges',
      data: {
        source: sourceId,
        target: targetId,
      },
      classes,
    };
    this.cy.add(edge);
    return edge;
  }

  private getPageUriNodeId(): GraphID {
    return void 0;
  }

  private getSurfaceNodeId(): GraphID {
    return this.getPageUriNodeId();
  }

  private getComponentNodeId(): GraphID {
    return this.getSurfaceNodeId();
  }

  private getLabelNodeId(): GraphID {
    return this.getComponentNodeId();
  }

  private getTupleNodeId(): GraphID {
    return this.getLabelNodeId();
  }

  private getTriggerFlowletNodeId(flowlet: Flowlet | null | undefined): GraphID {
    if (!flowlet) {
      return;
    }

    const parentId = this.getTriggerFlowletNodeId(flowlet.parent);
    const id = '' + flowlet.id;
    const node = this.cy.$id(id);
    if (node.empty()) {
      this.addNode({
        classes: 'flowlet',
        data: {
          id,
          label: flowlet.name + ":" + id,
          // parent: parentId,
        }
      });
      this.addEdge(parentId, id, 'flowlet');
    }

    return id;
  }

  private getALEventNodeId<T extends SupportedALEventNames>(eventName: T, eventData: SupportedALEventData<T>): GraphID {
    const id = '' + eventData.eventIndex;
    eventData.event
    this.addNode({
      data: {
        id,
        label: `${eventName}[${eventData.event}]`,
        // color: 'red',
      },
      classes: [eventName, eventData.event]
    });
    this.addEdge(this.getTupleNodeId(), id);
    this.addEdge(this.getTriggerFlowletNodeId(eventData.triggerFlowlet), id);
    if (eventData.relatedEventIndex) {
      const relatedId = '' + eventData.relatedEventIndex
      if (this.cy.$id(relatedId).nonempty()) {
        this.addEdge('' + relatedId, id, 'related');
      } else {
        console.warn(`Related Event Index not yet added for ${relatedId} for ${eventName}`);
      }
    }
    return id;
  }

  addALEventNodeId<T extends SupportedALEventNames>(eventName: T, eventData: SupportedALEventData<T>): void {
    this.cy.startBatch();
    this.getALEventNodeId(eventName, eventData);
    this.layout.stop();
    this.layout = this.cy.elements().layout(getCytoscapeLayoutConfig('klay'));
    this.layout.run();
    this.cy.endBatch();
  }

}



