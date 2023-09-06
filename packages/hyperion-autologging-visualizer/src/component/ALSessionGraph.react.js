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
// TODO: move this out into a config that can be passed to the graph component, which includes the config
const LAYOUT = { name: 'elk' }; // {name: 'elk | klay' | 'dagre' | 'cola'}
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
    nodeDimensionsIncludeLabels: false,
    fit: false,
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
// function _ALSessionPetri(props: CyProps): React.JSX.Element {
//   // If we have a need to try using cytoscape directly instead of through CytoscapeComponent
//   const container = React.useRef(null);
//   const cy = React.useRef<cytoscape.Core | null>(null);
//   const layout = {...LAYOUT, ...CONFIG};
//   React.useEffect(() => {
//     cy.current = Cytoscape(
//       {
//         container: container.current,
//         elements: props.elements,
//         style: props.stylesheet,
//         layout: layout,
//       }
//     );
//   });
//   React.useEffect(() => {
//     cy.current?.layout(layout).run()
//   }, [props.elements, cy]);
//   return  <div id="cy"
//             className="test"
//             style={{height: props.height, width: props.width}}
//             ref={(container)}></div>;
// }
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
        cy.current = ref;
        cy.current.layout({ ...LAYOUT, ...CONFIG }).run();
        if (!listenerRegistered) {
            cy.current.on('click mouseover', 'node', (event) => {
                console.log('[PS]', event.type, event.target.data(), event.target.scratch());
            });
            cy.current.on('click', 'edge', (event) => {
                console.log('[PS]', event.type, event.target.data(), event.target.scratch());
            });
            setListenerRegistered(true);
        }
    }, [cy]);
    return React.createElement(React.Fragment, null,
        !hide && React.createElement(CytoscapeComponent, { cy: setCytoscape, stylesheet: props.stylesheet ?? defaultStylesheet, elements: props.elements, style: { width: props.width, height: props.height }, layout: LAYOUT }),
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
            // TODO: if we don't copy, then flowlet references for old events are changed
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQUxTZXNzaW9uR3JhcGgucmVhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBTFNlc3Npb25HcmFwaC5yZWFjdC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFDSCx5RUFBeUU7QUFDekUsT0FBTyxLQUFLLFdBQVcsTUFBTSxnREFBZ0QsQ0FBQztBQU05RSxPQUFPLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFFbEMsT0FBTyxrQkFBa0IsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRCxPQUFPLElBQUksTUFBTSxnQkFBZ0IsQ0FBQztBQUNsQyxPQUFPLEdBQUcsTUFBTSxlQUFlLENBQUM7QUFDaEMsT0FBTyxLQUFLLE1BQU0saUJBQWlCLENBQUM7QUFDcEMsT0FBTyxJQUFJLE1BQU0sZ0JBQWdCLENBQUM7QUFDbEMsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBSTFCLHlHQUF5RztBQUN6RyxNQUFNLE1BQU0sR0FBRyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLDBDQUEwQztBQUV4RSxNQUFNLFVBQVUsR0FBRztJQUNqQixTQUFTLEVBQUUsS0FBSztJQUNoQiwyQkFBMkIsRUFBRSxJQUFJO0lBQ2pDLGdGQUFnRjtJQUNoRixHQUFHLEVBQUUsSUFBSTtJQUNULE9BQU8sRUFBRSxFQUFFO0lBQ1gsT0FBTyxFQUFFLElBQUk7SUFDYixhQUFhLEVBQUUsVUFBVSxLQUFVLEVBQUUsRUFBTyxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM5RCxpQkFBaUIsRUFBRSxHQUFHO0lBQ3RCLGVBQWUsRUFBRSxTQUFTO0lBQzFCLFNBQVMsRUFBRSxVQUFVLEtBQVUsRUFBRSxHQUFRLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzFELEtBQUssRUFBRSxTQUFTO0lBQ2hCLElBQUksRUFBRSxTQUFTO0lBQ2YsaUJBQWlCLEVBQUUsU0FBUztJQUM1QixHQUFHLEVBQUU7UUFDSCx5RUFBeUU7UUFDekUs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LEVBQUUsRUFBRTtRQUNsRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3JFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2xHLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3JHLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDbkUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLDJCQUEyQixFQUFFLEVBQUU7UUFDakYsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsMEJBQTBCLEVBQUUsRUFBRTtRQUM3RixFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsMkJBQTJCLEVBQUUsRUFBRTtLQUNuRixDQUFDO0lBRUYsT0FBTyxDQUNMLDZCQUFLLEtBQUssRUFBRSxFQUFDLEtBQUssRUFBQyxNQUFNLEVBQUUsT0FBTyxFQUFDLGNBQWMsRUFBQztRQUloRCw2QkFBSyxLQUFLLEVBQUUsRUFBQyxTQUFTLEVBQUMsTUFBTSxFQUFDO1lBQzlCO2dCQUNFLHNEQUE0QjtnQkFDNUIsb0JBQUMsbUJBQW1CLElBQ2hCLE1BQU0sRUFBRSxPQUFPLEVBQ2YsS0FBSyxFQUFFLE1BQU0sRUFDYixRQUFRLEVBQUUsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEdBQUksQ0FDNUM7WUFDTjtnQkFDRSxtREFBeUI7Z0JBQ3pCLG9CQUFDLG1CQUFtQixJQUNsQixNQUFNLEVBQUUsT0FBTyxFQUNmLEtBQUssRUFBRSxNQUFNLEVBQ2IsUUFBUSxFQUFFLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUksQ0FDekQ7WUFDTjtnQkFDRSw2Q0FBbUI7Z0JBQ25CLG9CQUFDLG1CQUFtQixJQUNsQixNQUFNLEVBQUUsT0FBTyxFQUNmLEtBQUssRUFBRSxNQUFNLEVBQ2IsUUFBUSxFQUFFLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUksQ0FDeEQ7WUFDSix1Q0FBYTtZQUNiLG9CQUFDLG1CQUFtQixJQUNsQixNQUFNLEVBQUUsT0FBTyxFQUNmLEtBQUssRUFBRSxNQUFNLEVBQ2IsUUFBUSxFQUFFLFlBQVksR0FBSSxDQU14QixDQUNGLENBQ1AsQ0FBQztBQUNKLENBQUMifQ==