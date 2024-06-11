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
import { SURFACE_SEPARATOR } from '@hyperion/hyperion-autologging/src/ALSurfaceConsts';

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
    selector: "node.surface", style: {
      shape: 'round-tag',
    }
  },
  {
    selector: "node.page", style: {
      // @ts-ignore
      shape: 'right-rhomboid',
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

  private startBatch() {
    this.cy.startBatch();
  }
  private endBatch() {
    this.layout.stop();
    this.layout = this.cy.layout(getCytoscapeLayoutConfig('klay'));
    this.layout.run();
    this.cy.endBatch();
  }

  private getPageUriNodeId(pageURI?: string): GraphID {
    if (!pageURI) {
      return;
    }

    if (this.cy.$id(pageURI).empty()) {
      this.addNode({
        classes: 'page',
        data: {
          id: pageURI,
          label: pageURI,
        }
      })
    }
    return pageURI;
  }

  private getSurfaceNodeId(surface: string | null, pageURI: string): GraphID {
    if (!surface) {
      return;
    }
    const id = surface;
    if (this.cy.$id(id).empty()) {
      const prefixIndex = surface.lastIndexOf(SURFACE_SEPARATOR);
      let surfaceName: string;
      let parentSurfaceId: GraphID;
      let pageId: GraphID;
      if (prefixIndex > 0) {
        surfaceName = surface.slice(prefixIndex);
        const parentSurfaceName = surface.slice(0, prefixIndex)
        parentSurfaceId = this.getSurfaceNodeId(parentSurfaceName, pageURI);
      } else {
        // Top surface
        surfaceName = surface;
        pageId = this.getPageUriNodeId(pageURI);
      }
      this.addNode({
        classes: 'surface',
        data: {
          id,
          label: surfaceName,
          // parent: parentSurfaceId,
        }
      });
      this.addEdge(parentSurfaceId, id);
      this.addEdge(pageId, id);
    }
    return id;
  }

  private getComponentNodeId(_componentName: string | null | undefined): GraphID {
    return;
  }

  private getLabelNodeId(_label: string | null): GraphID {
    return;
  }

  private getTupleNodeId(eventData: SupportedALEventData<'al_ui_event'>): GraphID {
    const surfaceId = this.getSurfaceNodeId(eventData.surface, eventData.pageURI);
    const componentId = this.getComponentNodeId(eventData.reactComponentName);
    const labelId = this.getLabelNodeId(eventData.elementName);
    this.addEdge(surfaceId, componentId);
    this.addEdge(componentId, labelId);
    return labelId ?? componentId ?? surfaceId;
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
    this.startBatch();
    this.getALEventNodeId(eventName, eventData);
    this.endBatch();
  }

  addALUIEventNodeId<T extends 'al_ui_event'>(eventName: T, eventData: SupportedALEventData<T>): void {
    if (this.cy.container()?.contains(eventData.targetElement)) {
      // Don't want to capture clicks on the graph itself.
      return;
    }
    this.startBatch();
    const id = this.getALEventNodeId(eventName, eventData);
    this.addEdge(this.getTupleNodeId(eventData), id);
    this.endBatch();
  }

  addSurfaceEvent<T extends 'al_surface_mutation_event'>(eventName: T, eventData: SupportedALEventData<T>): void {
    this.startBatch();
    this.addEdge(
      this.getSurfaceNodeId(eventData.surface, eventData.pageURI),
      this.getALEventNodeId(eventName, eventData)
    );
    this.endBatch();
  }
}



