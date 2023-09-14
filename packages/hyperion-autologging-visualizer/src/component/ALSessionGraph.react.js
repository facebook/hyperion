/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
// import React, {useState, useCallback, useRef, useEffect} from "react";
import * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import klay from 'cytoscape-klay';
import elk from 'cytoscape-elk';
import dagre from 'cytoscape-dagre';
import cola from 'cytoscape-cola';
import React from "react";
// TODO: move this out into a config that can be passed to the graph component, which includes the config mapping
const LAYOUT = { name: 'klay' }; // {name: 'elk | klay' | 'dagre' | 'cola'}
const ELK_CONFIG = {
    randomize: false,
    nodeDimensionsIncludeLabels: true,
    // TODO: this pans back out when enabled,  we may want to make this configurable
    fit: true,
    padding: 20,
    animate: true,
    animateFilter: function (_node, _i) { return true; },
    animationDuration: 500,
    animationEasing: undefined,
    transform: function (_node, pos) { return pos; },
    ready: undefined,
    stop: undefined,
    nodeLayoutOptions: undefined,
    elk: {
        // All options are available at http://www.eclipse.org/elk/reference.html
        //
        // 'org.eclipse.' can be dropped from the identifier. The subsequent identifier has to be used as property key in quotes.
        // E.g. for 'org.eclipse.elk.direction' use:
        // 'elk.direction'
        //
        // Enums use the name of the enum as string e.g. instead of Direction.DOWN use:
        // 'elk.direction': 'DOWN'
        //
        // The main field to set is `algorithm`, which controls which particular layout algorithm is used.
        // Example (downwards layered layout):
        'algorithm': 'layered',
        'elk.direction': 'RIGHT',
    },
    priority: function (_edge) { return null; }, // Edges with a non-nil value are skipped when geedy edge cycle breaking is enabled
};
const KLAY_CONFIG = {
    randomize: false,
    nodeDimensionsIncludeLabels: true,
    fit: true,
    padding: 20,
    animate: true,
    animateFilter: function (_node, _i) { return true; },
    animationDuration: 500,
    animationEasing: undefined,
    transform: function (_node, pos) { return pos; },
    ready: undefined,
    stop: undefined,
    klay: {
        // Following descriptions taken from http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
        addUnnecessaryBendpoints: false,
        aspectRatio: 1.6,
        borderSpacing: 20,
        compactComponents: false,
        crossingMinimization: 'LAYER_SWEEP',
        /* LAYER_SWEEP The layer sweep algorithm iterates multiple times over the layers, trying to find node orderings that minimize the number of crossings. The algorithm uses randomization to increase the odds of finding a good result. To improve its results, consider increasing the Thoroughness option, which influences the number of iterations done. The Randomization seed also influences results.
        INTERACTIVE Orders the nodes of each layer by comparing their positions before the layout algorithm was started. The idea is that the relative order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive layer sweep algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
        cycleBreaking: 'GREEDY',
        /* GREEDY This algorithm reverses edges greedily. The algorithm tries to avoid edges that have the Priority property set.
        INTERACTIVE The interactive algorithm tries to reverse edges that already pointed leftwards in the input graph. This requires node and port coordinates to have been set to sensible values.*/
        direction: 'UNDEFINED',
        /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
        edgeRouting: 'ORTHOGONAL',
        edgeSpacingFactor: 0.5,
        feedbackEdges: false,
        fixedAlignment: 'NONE',
        /* NONE Chooses the smallest layout from the four possible candidates.
        LEFTUP Chooses the left-up candidate from the four possible candidates.
        RIGHTUP Chooses the right-up candidate from the four possible candidates.
        LEFTDOWN Chooses the left-down candidate from the four possible candidates.
        RIGHTDOWN Chooses the right-down candidate from the four possible candidates.
        BALANCED Creates a balanced layout from the four possible candidates. */
        inLayerSpacingFactor: 1.0,
        layoutHierarchy: false,
        linearSegmentsDeflectionDampening: 0.3,
        mergeEdges: false,
        mergeHierarchyCrossingEdges: true,
        nodeLayering: 'NETWORK_SIMPLEX',
        /* NETWORK_SIMPLEX This algorithm tries to minimize the length of edges. This is the most computationally intensive algorithm. The number of iterations after which it aborts if it hasn't found a result yet can be set with the Maximal Iterations option.
        LONGEST_PATH A very simple algorithm that distributes nodes along their longest path to a sink node.
        INTERACTIVE Distributes the nodes into layers by comparing their positions before the layout algorithm was started. The idea is that the relative horizontal order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive node layering algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
        nodePlacement: 'BRANDES_KOEPF',
        /* BRANDES_KOEPF Minimizes the number of edge bends at the expense of diagram size: diagrams drawn with this algorithm are usually higher than diagrams drawn with other algorithms.
        LINEAR_SEGMENTS Computes a balanced placement.
        INTERACTIVE Tries to keep the preset y coordinates of nodes from the original layout. For dummy nodes, a guess is made to infer their coordinates. Requires the other interactive phase implementations to have run as well.
        SIMPLE Minimizes the area at the expense of... well, pretty much everything else. */
        randomizationSeed: 1,
        routeSelfLoopInside: false,
        separateConnectedComponents: true,
        spacing: 20,
        thoroughness: 7 // How much effort should be spent to produce a nice layout..
    },
    priority: function (_edge) { return null; }, // Edges with a non-nil value are skipped when greedy edge cycle breaking is enabled
};
const DAGRE_CONFIG = {
    // dagre algo options, uses default value on undefined
    nodeSep: undefined,
    edgeSep: undefined,
    rankSep: undefined,
    rankDir: undefined,
    align: undefined,
    acyclicer: undefined,
    // A feedback arc set is a set of edges that can be removed to make a graph acyclic.
    ranker: undefined,
    minLen: function (_edge) { return 1; },
    edgeWeight: function (_edge) { return 1; },
    // general layout options
    fit: true,
    padding: 30,
    spacingFactor: undefined,
    nodeDimensionsIncludeLabels: false,
    animate: true,
    animateFilter: function (_node, _i) { return true; },
    animationDuration: 500,
    animationEasing: undefined,
    boundingBox: undefined,
    transform: function (_node, pos) { return pos; },
    ready: function () { },
    sort: undefined,
    // because cytoscape dagre creates a directed graph, and directed graphs use the node order as a tie breaker when
    // defining the topology of a graph, this sort function can help ensure the correct order of the nodes/edges.
    // this feature is most useful when adding and removing the same nodes and edges multiple times in a graph.
    stop: function () { } // on layoutstop
};
const COLA_CONFIG = {
    animate: true,
    refresh: 1,
    maxSimulationTime: 4000,
    ungrabifyWhileSimulating: false,
    fit: true,
    padding: 30,
    boundingBox: undefined,
    nodeDimensionsIncludeLabels: false,
    // layout event callbacks
    ready: function () { },
    stop: function () { },
    // positioning options
    randomize: false,
    avoidOverlap: true,
    handleDisconnected: true,
    convergenceThreshold: 0.01,
    nodeSpacing: function (_node) { return 10; },
    flow: { axis: 'x', minSeparation: 30 },
    alignment: undefined,
    gapInequalities: undefined,
    centerGraph: true,
    // different methods of specifying edge length
    // each can be a constant numerical value or a function like `function( edge ){ return 2; }`
    edgeLength: undefined,
    edgeSymDiffLength: undefined,
    edgeJaccardLength: undefined,
    // iterations of cola algorithm; uses default values on undefined
    unconstrIter: undefined,
    userConstIter: undefined,
    allConstIter: undefined, // initial layout iterations with all constraints including non-overlap
};
let CONFIG = null;
if (LAYOUT.name === 'klay') {
    console.log('[PS] using klay');
    Cytoscape.use(klay);
    CONFIG = KLAY_CONFIG;
}
else if (LAYOUT.name === 'elk') {
    console.log('[PS] using elk');
    Cytoscape.use(elk);
    CONFIG = ELK_CONFIG;
}
else if (LAYOUT.name === 'dagre') {
    console.log('[PS] using dagre');
    Cytoscape.use(dagre);
    CONFIG = DAGRE_CONFIG;
}
else if (LAYOUT.name === 'cola') {
    console.log('[PS] using cola');
    Cytoscape.use(cola);
    CONFIG = COLA_CONFIG;
}
const defaultStylesheet = [
    {
        selector: 'node',
        style: {
            'background-color': 'data(color)',
            'label': 'data(label)'
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 3,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
        }
    }
];
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
const NodeColorMap = new Map([
    ['click', 'green'],
    ['click[al_ui_event]', 'green'],
    ['click[al_ui_event_capture]', 'lightgreen'],
    ['click[al_ui_event_bubble]', 'darkgreen'],
    ['network_request', 'gold'],
    ['network_response', 'yellow'],
    ['network', 'khaki'],
    ['mount', 'blue'],
    ['unmount', 'lightblue'],
    ['mount_component', 'blue'],
    ['unmount_component', 'lightblue'],
    ['heartbeat', 'red'],
    ['ad_spec_change', 'orange'],
    ['hover', 'purple'],
    ['parent', 'lightblue'],
    ['flowlet-part', 'gray'],
]);
const EdgeColorMap = new Map([
    ['flowlet', 'red'],
    ['seq', 'black'],
    ['ce', 'blue']
]);
function formatEventBufferv2(events, uiFlowlet = true, flowletFullName = true) {
    const elements = [];
    const eventNodes = [];
    let nodeId = 0;
    let flowletsSeen = [];
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        // Event node
        const eventName = event.channelEventName != null ? `${event.event}[${event.channelEventName}]` : event.event;
        const srcNode = {
            scratch: { _event: event },
            data: {
                color: NodeColorMap.get(eventName),
                id: String(nodeId++),
                label: eventName,
            }
        };
        elements.push(srcNode);
        // If flowlet insert flowlet parent node
        const flowlet = uiFlowlet ? event.copiedFlowlet?.data?.uiEventFlowlet : event.copiedFlowlet;
        if (flowlet != null) {
            const flowletName = flowletFullName ? flowlet.fullName : flowlet.name;
            if (!(flowletName === '/top' || flowletName === 'top')) {
                // We match to a previous flowlet,  add edge to parent
                const matchFlowlet = flowletsSeen.find((val) => flowletName.includes(val.flowlet));
                if (matchFlowlet) {
                    elements.push({
                        data: {
                            source: String(matchFlowlet.flowletNodeId),
                            target: srcNode.data.id,
                            color: EdgeColorMap.get('flowlet'),
                            label: matchFlowlet.flowletNodeId + '->' + srcNode.data.id,
                        }
                    });
                }
                // Processing a new flowlet
                //else {
                const flowletParentId = nodeId++;
                flowletsSeen.push({ flowlet: flowletName, flowletNodeId: flowletParentId });
                // Flowlet node
                const flowletParent = {
                    scratch: { _event: event },
                    data: {
                        color: NodeColorMap.get('parent'),
                        id: String(flowletParentId),
                        label: flowletName,
                    }
                };
                elements.push(flowletParent);
                // Edge from src to flowlet parent
                elements.push({
                    data: {
                        source: srcNode.data.id,
                        target: String(flowletParentId),
                        color: EdgeColorMap.get('flowlet'),
                        label: srcNode.data.id + '->' + flowletParentId,
                    }
                });
                const flowletParts = flowletName.split(/\/(?![^(]*\))/).filter(p => p != '');
                for (let k = 0; k < flowletParts.length; k++) {
                    const nodeId = 'flowlet[' + flowletParentId + ']' + 'flowlet-part' + String(k);
                    const previousNodeId = 'flowlet[' + flowletParentId + ']' + 'flowlet-part' + String(k - 1);
                    elements.push({
                        scratch: { _event: flowlet },
                        data: {
                            parent: String(flowletParentId),
                            color: NodeColorMap.get('flowlet-part'),
                            id: nodeId,
                            label: flowletParts[k],
                        }
                    });
                    if (k > 0) {
                        console.log('[PS] Part', flowletParts[k]);
                        // add edge from previous
                        elements.push({
                            data: {
                                source: previousNodeId,
                                target: nodeId,
                                color: EdgeColorMap.get('seq'),
                                label: previousNodeId + '->' + nodeId,
                            }
                        });
                    }
                }
            }
        }
        // Even if flowlet is available assign a sequential edge to last of eventNodes
        if (eventNodes) {
            const node = eventNodes.at(-1);
            if (node) {
                elements.push({
                    data: {
                        source: node.data.id,
                        target: srcNode.data.id,
                        color: EdgeColorMap.get('seq'),
                        label: node.data.id + '->' + srcNode.data.id,
                    }
                });
            }
        }
        eventNodes.push(srcNode);
    }
    return elements;
}
function formatEventBuffer(events) {
    // Look into compound nodes for grouping non-ui events in compound nodes
    // https://js.cytoscape.org/#notation/compound-nodes via `parent` field
    const elements = [];
    // ui flowlet mapped to list of nodes matching,
    // generate a parent node from the key, and then children are within the parent
    const flowletMap = new Map();
    // Iterate over all events, pushing events + edges
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const id = i.toString();
        if (event.copiedFlowlet != null) {
            const key = event.copiedFlowlet.data?.uiEventFlowlet?.id;
            if (key != null && event.copiedFlowlet.data?.uiEventFlowlet != null) {
                if (!flowletMap.has(key)) {
                    flowletMap.set(key, {
                        flowlet: event.copiedFlowlet.data?.uiEventFlowlet,
                        source: id,
                        links: []
                    });
                }
                flowletMap.get(key)?.links.push(id);
            }
        }
        elements.push({
            scratch: { _event: event },
            data: {
                color: NodeColorMap.get(events[i].event),
                id: id,
                label: events[i].event,
            }
        });
        if (i > 0) {
            // Sequential edge
            elements.push({
                data: {
                    source: (i - 1).toString(),
                    target: i.toString(),
                    label: (i - 1).toString() + '->' + i.toString()
                }
            });
        }
    }
    // Handle flowlet links
    for (const key of flowletMap.keys()) {
        const src = flowletMap.get(key)?.source;
        if (src == null) {
            continue;
        }
        elements.push(
        // Parent node
        {
            data: {
                id: String(key),
                label: String(flowletMap.get(key)?.flowlet?.name),
                color: 'pink',
            }
        }, 
        // Edge from source to parent
        {
            data: {
                source: src,
                target: String(key),
                color: EdgeColorMap.get('flowlet'),
                label: src + '->' + key
            }
        });
        if (src != null && parseInt(src) + 1 < events.length) {
            elements.push(
            // NAIVE edge from parent to next index
            {
                data: {
                    source: String(key),
                    target: String(parseInt(src) + 1),
                    color: EdgeColorMap.get('flowlet'),
                    label: key + '->' + String(parseInt(src) + 1)
                }
            });
        }
    }
    return elements;
}
function ALSessionPetriReact(props) {
    const [listenerRegistered, setListenerRegistered] = React.useState(false);
    const [hide, setHide] = React.useState(false);
    const cy = React.useRef(null);
    const setCytoscape = React.useCallback((ref) => {
        if (ref == null) {
            return;
        }
        cy.current = ref;
        cy.current?.layout({ ...LAYOUT, ...CONFIG }).run();
        if (!listenerRegistered) {
            cy.current?.on('click mouseover', 'node', (event) => {
                console.log('[PS]', event.type, event.target.data(), event.target.scratch());
            });
            cy.current?.on('click', 'edge', (event) => {
                console.log('[PS]', event.type, event.target.data(), event.target.scratch());
            });
            setListenerRegistered(true);
        }
    }, [cy]);
    return React.createElement(React.Fragment, null,
        !hide && React.createElement(CytoscapeComponent, { cy: setCytoscape, headless: false, stylesheet: props.stylesheet ?? defaultStylesheet, elements: props.elements, style: { width: props.width, height: props.height } }),
        React.createElement("button", { onClick: () => setHide(!hide) }, hide ? 'Show Graph' : 'Hide Graph'),
        React.createElement("button", { onClick: () => { const e = Math.random() * 100; cy.current?.add([{ data: { id: 'one' + String(e), label: 'Node ' + e }, position: { x: 0, y: 0 } }]); } }, "Add Dummy Node"));
}
export function ALSessionGraph() {
    const [eventBuffer, setEventBuffer] = React.useState([]);
    const addEvent = React.useCallback((event) => {
        setEventBuffer(eventBuffer => {
            // Skip clicks on the graph...
            if (event.targetElement != null && event.targetElement.nodeName === "CANVAS") {
                return eventBuffer;
            }
            // TODO: if we don't copy, then flowlet seems to continue mutating
            const { flowlet, ...data } = event;
            let copied = {
                ...data,
                ...{ copiedFlowlet: (event.flowlet != null ? {
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
                    } : undefined) },
            };
            return [...eventBuffer, copied];
        });
    }, []);
    React.useEffect(() => {
        // Set up listeners
        const removeListeners = [];
        const options = AutoLogging.getInitOptions();
        const uiChannel = options.uiEventPublisher?.channel;
        const uiEvents = [
            'al_ui_event',
            // Pretty noisy,  but may be useful to debug
            // 'al_ui_event_capture',
            // 'al_ui_event_bubble',
        ];
        uiEvents.forEach(eventName => {
            const listener = uiChannel?.on(eventName).add(e => addEvent({ ...e, channelEventName: eventName }));
            if (listener) {
                removeListeners.push(() => uiChannel?.removeListener(eventName, listener));
            }
        });
        const surfaceChannel = options.surfaceMutationPublisher?.channel;
        const surfaceListener = surfaceChannel?.on('al_surface_mutation_event').add(addEvent);
        if (surfaceListener) {
            removeListeners.push(() => surfaceChannel?.removeListener('al_surface_mutation_event', surfaceListener));
        }
        const heartbeatChannel = options.heartbeat?.channel;
        const heartbeatListener = heartbeatChannel?.on('al_heartbeat_event').add(addEvent);
        if (heartbeatListener) {
            removeListeners.push(() => heartbeatChannel?.removeListener('al_heartbeat_event', heartbeatListener));
        }
        // With this enabled,  there's like an infinite loop of interception and emitting events /then/then/then/then/then/then/then/then/then/then/....
        // const flowletChannel = options.flowletPublisher?.channel;
        // const flowletListener = flowletChannel?.on('al_flowlet_event').add(e => addEvent({event: "flowlet_init", ...e}));
        // if (flowletListener) {
        //   removeListeners.push(
        //     () => flowletChannel?.removeListener('al_flowlet_event', flowletListener)
        //   );
        // }
        const networkChannel = options.network?.channel;
        const networkEvents = [
            'al_network_request',
            'al_network_response',
        ];
        networkEvents.forEach(eventName => {
            const listener = networkChannel?.on(eventName).add(addEvent);
            if (listener) {
                removeListeners.push(() => networkChannel?.removeListener(eventName, listener));
            }
        });
        // Remove registered listeners
        return () => removeListeners.forEach(rm => rm());
    }, [addEvent]);
    const testElements = [
        { data: { id: 'one', label: 'Node 1' }, position: { x: 0, y: 0 } },
        { data: { id: 'parent', label: 'Parent' }, position: { x: 0, y: 0 } },
        { data: { parent: 'parent', id: 'two', label: 'Node 2', color: 'blue' }, position: { x: 0, y: 0 } },
        { data: { parent: 'parent', id: 'three', label: 'Node 3', color: 'blue' }, position: { x: 0, y: 0 } },
        { data: { id: 'four', label: 'Node 3' }, position: { x: 0, y: 0 } },
        { data: { source: 'one', target: 'parent', label: 'Edge from Node1 to Parent' } },
        { data: { source: 'two', target: 'three', color: 'red', label: 'Edge from Node3 to Node4' } },
        { data: { source: 'parent', target: 'four', label: 'Edge from Parent to Node4' } }
    ];
    return (React.createElement("div", { style: { width: "100%", display: "inline-block" } },
        React.createElement("div", { style: { textAlign: "left" } },
            React.createElement("div", null,
                React.createElement("h2", null, "Simple (UI Flowlet)"),
                React.createElement(ALSessionPetriReact, { height: '200px', width: '100%', elements: formatEventBuffer(eventBuffer) })),
            React.createElement("div", null,
                React.createElement("h2", null, "Flowlet (Non UI)"),
                React.createElement(ALSessionPetriReact, { height: '200px', width: '100%', elements: formatEventBufferv2(eventBuffer, false, true) })),
            React.createElement("div", null,
                React.createElement("h2", null, "UI Flowlet"),
                React.createElement(ALSessionPetriReact, { height: '200px', width: '100%', elements: formatEventBufferv2(eventBuffer, true, true) })),
            React.createElement("h2", null, "Test"),
            React.createElement(ALSessionPetriReact, { height: '200px', width: '100%', elements: testElements }))));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQUxTZXNzaW9uR3JhcGgucmVhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBTFNlc3Npb25HcmFwaC5yZWFjdC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFDSCx5RUFBeUU7QUFDekUsT0FBTyxLQUFLLFdBQVcsTUFBTSxnREFBZ0QsQ0FBQztBQU05RSxPQUFPLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFFbEMsT0FBTyxrQkFBa0IsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRCxPQUFPLElBQUksTUFBTSxnQkFBZ0IsQ0FBQztBQUNsQyxPQUFPLEdBQUcsTUFBTSxlQUFlLENBQUM7QUFDaEMsT0FBTyxLQUFLLE1BQU0saUJBQWlCLENBQUM7QUFDcEMsT0FBTyxJQUFJLE1BQU0sZ0JBQWdCLENBQUM7QUFDbEMsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBSTFCLGlIQUFpSDtBQUNqSCxNQUFNLE1BQU0sR0FBRyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDLDBDQUEwQztBQUV6RSxNQUFNLFVBQVUsR0FBRztJQUNqQixTQUFTLEVBQUUsS0FBSztJQUNoQiwyQkFBMkIsRUFBRSxJQUFJO0lBQ2pDLGdGQUFnRjtJQUNoRixHQUFHLEVBQUUsSUFBSTtJQUNULE9BQU8sRUFBRSxFQUFFO0lBQ1gsT0FBTyxFQUFFLElBQUk7SUFDYixhQUFhLEVBQUUsVUFBVSxLQUFVLEVBQUUsRUFBTyxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM5RCxpQkFBaUIsRUFBRSxHQUFHO0lBQ3RCLGVBQWUsRUFBRSxTQUFTO0lBQzFCLFNBQVMsRUFBRSxVQUFVLEtBQVUsRUFBRSxHQUFRLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzFELEtBQUssRUFBRSxTQUFTO0lBQ2hCLElBQUksRUFBRSxTQUFTO0lBQ2YsaUJBQWlCLEVBQUUsU0FBUztJQUM1QixHQUFHLEVBQUU7UUFDSCx5RUFBeUU7UUFDekUs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