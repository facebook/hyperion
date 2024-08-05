/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
// import React, {useState, useCallback, useRef, useEffect} from "react";
import { ALExtensibleEvent, ALFlowletEvent } from '@hyperion/hyperion-autologging/src/ALType';
import { ALChannelEvent } from '@hyperion/hyperion-autologging/src/AutoLogging';
import { Flowlet } from '@hyperion/hyperion-flowlet/src/Flowlet';
import { Nullable } from '@hyperion/hyperion-util/src/Types';
import cytoscape from 'cytoscape';
import { getCytoscapeLayoutConfig } from './CytoscapeLayoutConfigDagre';
import { SURFACE_SEPARATOR } from '@hyperion/hyperion-autologging/src/ALSurfaceConsts';
import { assert } from '@hyperion/hyperion-global';

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
      // shape: 'round-tag',
    }
  },
  {
    selector: "node.page", style: {
      // shape: 'right-rhomboid',
    }
  },
  {
    selector: ':parent', css: {
      'background-color': 'white',
      'text-valign': 'top',
      'text-halign': 'center',
      'shape': 'round-rectangle',
      // 'corner-radius': "10",
      // 'padding': 10,
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
      "line-style": 'solid',
      "line-color": 'SteelBlue',
      'target-arrow-color': 'SteelBlue',
      // 'curve-style': 'taxi',
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
    selector: 'edge.trigger', style: {
      "line-style": 'dashed',
      "line-color": 'salmon',
      'target-arrow-color': 'salmon',
      "width": '1',
    }
  },
  {
    selector: 'edge.timestamp', style: {
      "line-style": 'dotted',
      "line-color": 'gold',
      'target-arrow-color': 'gold',
      'target-arrow-shape': 'tee',
      "width": '1',
    }
  },
  {
    selector: ".filtered", style: {
      display: "none"
    }
  },
  {
    selector: '.al_ui_event', style: {
      "background-color": 'green'
    }
  },
  {
    selector: '.al_surface_mutation_event.mount_component', style: {
      "background-color": 'HotPink'
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
    selector: '.al_surface_visibility_event.component_visible', style: {
      "background-color": 'purple'
    }
  },
  {
    selector: '.al_surface_visibility_event.component_hidden', style: {
      "background-color": 'orchid'
    }
  },
  {
    selector: '.flowlet', style: {
      "background-color": 'cyan'
    }
  },
  {
    selector: '.surface', style: {
      "background-color": 'tan'
    }
  },

];

export type ALGraphDynamicOptionsType = {
  version: number,
  events: {
    al_ui_event: {
      click: boolean;
      change: boolean;
      hover: boolean;
      [key: string]: boolean;
    };
    al_surface_mutation_event: {
      mount_component: boolean;
      unmount_component: boolean;
    };
    al_network_request: boolean;
    al_network_response: boolean;
    al_surface_visibility_event: {
      surface_visible: boolean;
      surface_hidden: boolean;
    };
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
  filter?: string;
};

type SupportedALEventNames = (keyof ALGraphDynamicOptionsType['events']) & (keyof ALChannelEvent); // & to filter out typos in the list
type SupportedALEventData<T extends SupportedALEventNames> = ALChannelEvent[T][0] & Partial<Nullable<ALFlowletEvent>> & ALExtensibleEvent;
export type EventInfo<T extends SupportedALEventNames> = {
  eventName: T,
  eventData: SupportedALEventData<T>,
}
export type EventInfos = EventInfo<SupportedALEventNames>;

export const SupportedALEvents: SupportedALEventNames[] = [
  'al_ui_event',
  'al_surface_mutation_event',
  // 'al_heartbeat_event', // causes un-necessary re-layout
  'al_network_request',
  'al_network_response',
  'al_surface_visibility_event',
] as const;

type GraphID = string | undefined;

type TriggerFlowletRegion = {
  // The interaction it belongs to
  interaction: {
    flowsId: GraphID,
    eventsId: GraphID,
  } | null,

  // Id of this trigger flowlet
  triggerFlowletId: GraphID,
}


export type ALGraphConstructorOptions = {
  onEventNodeClick?: (eventInfo: EventInfos) => void;
  topContainer?: Element | null;
  graphContainer: HTMLElement;
  elements?: cytoscape.ElementDefinition[];
};

export class ALGraph {
  private readonly topContainer: Element | null;
  private dynamicOptions?: ALGraphDynamicOptionsType;
  private cy!: cytoscape.Core;
  private layout!: cytoscape.Layouts;
  private readonly onNodeClick?: (event: cytoscape.EventObject) => void;

  constructor(options: ALGraphConstructorOptions) {
    this.topContainer = options.topContainer ?? options.graphContainer;

    if (options.onEventNodeClick) {
      const onEventNodeClick = options.onEventNodeClick;
      this.onNodeClick = event => {
        const { target } = event;
        const eventInfo = target.scratch() as EventInfos;
        console.log('[PS]', event.type, target.data(), eventInfo);

        if (typeof eventInfo.eventName === "string") { // Just to be sure the right kind of data
          onEventNodeClick(eventInfo);
        }
      };
    }
    this.initGraph(options.graphContainer, options.elements);
  }

  private initGraph(graphContainer: HTMLElement | null, elements?: cytoscape.ElementDefinition[]) {
    this.cy = cytoscape({
      container: graphContainer,
      elements: elements,
    });

    this.cy.style(defaultStylesheet);
    this.layout = this.cy.layout(getCytoscapeLayoutConfig());

    if (this.onNodeClick) {
      this.cy.on('click', 'node', this.onNodeClick);
    }

    // cy.on('mouseover', 'node', (event) => {
    //   console.log('[PS]', event.type, event.target.data(), event.target.scratch());
    // });
    // cy.on('click', 'edge', (event) => {
    //   console.log('[PS]', event.type, event.target.data(), event.target.scratch());
    // });

    this.reLayout();
  }

  clearGraph(): void {
    this.initGraph(this.cy.container());
  }

  fitGraph(): void {
    this.cy.fit();
  }

  takeSnapshot() {
    const blob = this.cy.png({ output: 'blob' });
    const blobURL = window.URL.createObjectURL(blob);
    window.open(blobURL);
  }

  // An optimization to avoid unnecessary relayout when no elements are added
  private _elements: cytoscape.CollectionReturnValue | null = null;
  private reLayout() {
    // this._elements?.layout(getCytoscapeLayoutConfig()).run();
    this.layout.stop();
    this.layout = this.cy.layout(getCytoscapeLayoutConfig());
    this.layout.run();
  }
  private startBatch() {
    assert(this._elements == null, "Should not call startBatch before ending previous batch");
    this._elements = this.cy.collection();
    this.cy.startBatch();
  }
  private add(element: cytoscape.ElementDefinition): cytoscape.CollectionReturnValue {
    assert(this._elements != null, "Should not add nodes before calling startBatch");
    try {
      const elementDef = this.cy.add(element);
      this._elements.merge(elementDef);
      return elementDef;
    } catch (e) {
      return this.cy.add({
        data: {
          label: String(e),
        }
      });
    }
  }
  private endBatch() {
    const currElements = this._elements;
    assert(currElements != null, "Should not call endBatch before calling startBatch");
    let runLayout = currElements.nonempty();
    if (runLayout && this.dynamicOptions?.filter) {
      // Remove all undesired elements from the graph. Note desired elements showup in '.both' as well
      const { left: undesired, /* right: desired, both: _ */ } = currElements.diff(this.dynamicOptions.filter);
      /**
       * Note: A bad filter can potentially cause problem later if we just remove the nodes.
       * For example, if we add multiple nodes (e.g. trigger flowlet nodes) based on absence of one them, we may
       * get errors for duplicate node addition.
       * So, instead of removing nodes, we just add a class to them that hides them.
       * This way, we can also chose to change the filter later and bring those nodes back (not yet implemented)
       * // this.cy.remove(undesired); // See above for why this should not be used.
       */
      undesired.addClass("filtered");
      runLayout = currElements.size() > undesired.size();
    }

    this.cy.endBatch();
    this._elements = null;
    if (runLayout) {
      // Try to only layout added ones
      this.reLayout();
    }
  }

  private addNode(node: cytoscape.NodeDefinition): cytoscape.CollectionReturnValue {
    return this.add(node);
  }

  private addEdge(sourceId: GraphID, targetId: GraphID, classes?: string | string[]): cytoscape.CollectionReturnValue | null {
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
    return this.add(edge);
  }

  private getAppContainerNodeId(): GraphID {
    const appId: GraphID = '_app';
    if (this.cy.$id(appId).empty()) {
      this.addNode({
        data: {
          id: appId,
          label: "App"
        }
      });
    }
    return appId;
  }

  private getFlowsContainerNodeId(): GraphID {
    const flowsId: GraphID = '_flows';
    if (this.cy.$id(flowsId).empty()) {
      this.addNode({
        data: {
          id: flowsId,
          label: 'Flows',
        }
      });

    }
    return flowsId;
  }

  private getPageUriNodeId(pageURI?: string): GraphID {
    if (!pageURI || !this.dynamicOptions?.nodes.tuple.page_uri) {
      return;
    }

    const id = 'p:' + pageURI;
    if (this.cy.$id(id).empty()) {
      this.addNode({
        classes: 'page',
        data: {
          id,
          label: pageURI,
          parent: this.getAppContainerNodeId(),
        }
      })
    }
    return id;
  }

  private getSurfaceNodeId(surface: string | null, pageURI: string): GraphID {
    if (!surface || !this.dynamicOptions?.nodes.tuple.surface) {
      return;
    }
    const id = "s:" + surface;
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
          parent: this.getAppContainerNodeId(), // or? parentSurfaceId,
        }
      });
      this.addEdge(parentSurfaceId, id, 'surface');
      this.addEdge(pageId, id);
    }
    return id;
  }

  private getComponentNodeId(_componentName: string | null | undefined): GraphID {
    if (!this.dynamicOptions?.nodes.tuple.component) {
      return;
    }

    return;
  }

  private getLabelNodeId(_label: string | null): GraphID {
    if (!this.dynamicOptions?.nodes.tuple.text) {
      return;
    }

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

  private getTimestampNodeId(timestamp: number): GraphID {
    return; // For now ignore this until a good layout algo is found.
    const id = 'ts:' + timestamp;

    const timelineId = 'timeline';
    let timeline = this.cy.$id(timelineId);
    if (timeline.empty()) {
      timeline = this.addNode({
        data: {
          id: timelineId,
          label: 'timeline',
        },
        scratch: {
          lastTimeId: id
        }
      });
    }

    this.addNode({
      classes: 'timestamp',
      data: {
        id,
        label: timestamp + 'ms',
        parent: timelineId,
      },
    });
    this.addEdge(timeline.scratch().lastTimeId, id);
    timeline.scratch().lastTimeId = id;
    return id;
  }

  private getTriggerFlowletNodeId(flowlet: Flowlet | null | undefined): TriggerFlowletRegion | null {
    if (!flowlet || !this.dynamicOptions?.nodes.trigger_flowlet) {
      return null;
    }

    const id = 'f:' + flowlet.id;
    const nodes = this.cy.$id(id);
    if (nodes.nonempty()) {
      const node = nodes[0];
      const triggerFloeletRegion = node.scratch().triggerFloeletRegion;
      assert(triggerFloeletRegion != null, 'Invalid situatoin in the graph! Must have a region when created!');
      return triggerFloeletRegion;
    }

    // Didn't find, need to create

    const triggerFloeletRegion: TriggerFlowletRegion = {
      triggerFlowletId: id,
      interaction: null,
    };
    let parentId: GraphID;
    let prevId: GraphID;

    const parentTriggerFloeletRegion = this.getTriggerFlowletNodeId(flowlet.parent);
    if (!parentTriggerFloeletRegion) {
      // We are at the root, which we want to leave alone
      triggerFloeletRegion.interaction = null;// No interaction defined for root.
      parentId = this.getFlowsContainerNodeId();
    } else if (parentTriggerFloeletRegion.interaction) {
      // we are some middle trigger of interactin, so reuse parents region
      triggerFloeletRegion.interaction = parentTriggerFloeletRegion.interaction;
      parentId = triggerFloeletRegion.interaction.flowsId;
      prevId = parentTriggerFloeletRegion.triggerFlowletId;
    } else {
      //We are at the root of interaction, so create a new region
      const regionId = `${id}_region`;
      const interaction = triggerFloeletRegion.interaction = {
        flowsId: `${id}_flows`,
        eventsId: `${id}_events`,
      };
      this.addNode({
        data: {
          id: regionId,
          label: 'interaction',
          parent: this.getFlowsContainerNodeId(),
        }
      });
      this.addNode({
        data: {
          id: interaction.flowsId,
          label: 'flows',
          parent: regionId,
        }
      });
      this.addNode({
        data: {
          id: interaction.eventsId,
          label: 'events',
          parent: regionId,
        }
      });
      parentId = triggerFloeletRegion.interaction.flowsId;
      // prevId = parentTriggerFloeletRegion.triggerFlowletId; // For now, let's let the first trigger to be free to move
    }

    this.addNode({
      classes: 'flowlet',
      data: {
        id,
        label: flowlet.name + ":" + id,
        parent: parentId,
      },
      scratch: {
        triggerFloeletRegion,
      }
    });
    this.addEdge(prevId, id, 'flowlet');

    return triggerFloeletRegion;
  }

  private _lastEventId: GraphID;
  private getALEventNodeId<T extends SupportedALEventNames>(eventName: T, eventData: SupportedALEventData<T>): GraphID {
    const EVENT_PREFIX = 'e:';
    const id = EVENT_PREFIX + eventData.eventIndex;

    const region = this.getTriggerFlowletNodeId(eventData.triggerFlowlet);

    this.addNode({
      classes: [eventName, eventData.event],
      data: {
        id,
        label: `${eventName}[${eventData.event}]`,
        parent: region?.interaction?.eventsId,
      },
      scratch: {
        eventName,
        eventData,
      } as EventInfo<T>,
    });

    if (this.dynamicOptions?.edges.trigger) {
      this.addEdge(region?.triggerFlowletId, id, 'trigger');
    }

    if (eventData.relatedEventIndex && this.dynamicOptions?.edges.related_event_index) {
      const relatedId = EVENT_PREFIX + eventData.relatedEventIndex
      if (this.cy.$id(relatedId).nonempty()) {
        this.addEdge('' + relatedId, id, 'related');
      } else {
        console.warn(`Related Event Index not yet added for ${relatedId} for ${eventName}`);
      }
    }

    this.addEdge(this._lastEventId, id, 'timestamp');
    this._lastEventId = id;
    const edge = this.addEdge(this.getTimestampNodeId(eventData.eventTimestamp), id, 'timestamp');
    if (edge) {
      edge.data().weight = 10;
    }
    return id;
  }

  setDynamicOptions(dynamicOptions: ALGraphDynamicOptionsType): void {
    this.dynamicOptions = dynamicOptions;
  }

  addALEventNodeId<T extends SupportedALEventNames>(eventName: T, eventData: SupportedALEventData<T>): void {
    if (!this.dynamicOptions?.events[eventName]) {
      return;
    }
    this.startBatch();
    this.getALEventNodeId(eventName, eventData);
    this.endBatch();
  }

  addALUIEventNodeId<T extends 'al_ui_event'>(eventName: T, eventData: SupportedALEventData<T>): void {
    if (this.topContainer?.contains(eventData.targetElement)) {
      // Don't want to capture clicks on the graph itself.
      return;
    }
    if (!this.dynamicOptions?.events[eventName][eventData.event]) {
      return;
    }

    this.startBatch();
    const id = this.getALEventNodeId(eventName, eventData);
    const tupleId = this.getTupleNodeId(eventData);
    if (this.dynamicOptions?.edges.tuple) {
      this.addEdge(id, tupleId);
    }
    this.endBatch();
  }

  private addSurfaceEvent<T extends 'al_surface_mutation_event' | 'al_surface_visibility_event'>(eventName: T, eventData: SupportedALEventData<T>): void {
    this.startBatch();
    const id = this.getALEventNodeId(eventName, eventData);
    if (this.dynamicOptions?.edges.tuple) {
      const tupleId = this.getSurfaceNodeId(eventData.surface, eventData.pageURI);
      this.addEdge(tupleId, id);
    }
    this.endBatch();
  }

  addSurfaceMutationEvent<T extends 'al_surface_mutation_event'>(eventName: T, eventData: SupportedALEventData<T>): void {
    if (!this.dynamicOptions?.events[eventName][eventData.event]) {
      return;
    }
    this.addSurfaceEvent(eventName, eventData);
  }

  addSurfaceVisibilityEvent<T extends 'al_surface_visibility_event'>(eventName: T, eventData: SupportedALEventData<T>): void {
    if (!this.dynamicOptions?.events[eventName][eventData.event]) {
      return;
    }
    this.addSurfaceEvent(eventName, eventData);
  }
}
