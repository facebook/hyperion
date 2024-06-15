/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type cytoscape from 'cytoscape';
import Cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';

const CONFIG: fcose.FcoseLayoutOptions = {
  name: 'fcose',
  // quality: 'default',

  // general layout options
  fit: true, // whether to fit to viewport
  padding: 20, // fit padding
  // nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
  // animate: true, // whether to transition the node positions
  // animateFilter: function (_node: any, _i: number) { return true; }, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 500, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled
  // boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  // transform: function (_node: any, pos: any) { return pos; }, // a function that applies a transform to the final node position
  // ready: function () { }, // on layoutready
  // sort: undefined, // a sorting function to order the nodes and edges; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
  // because cytoscape dagre creates a directed graph, and directed graphs use the node order as a tie breaker when
  // defining the topology of a graph, this sort function can help ensure the correct order of the nodes/edges.
  // this feature is most useful when adding and removing the same nodes and edges multiple times in a graph.
  // stop: function () { } // on layoutstop
} as const;

export function getCytoscapeLayoutConfig(): cytoscape.LayoutOptions {
  Cytoscape.use(fcose);
  return CONFIG;
}

