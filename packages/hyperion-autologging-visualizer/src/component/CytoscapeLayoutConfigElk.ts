/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type cytoscape from 'cytoscape';
import Cytoscape from 'cytoscape';
import elk from 'cytoscape-elk';

const ELK_CONFIG = {
  name: 'elk',
  randomize: false, // use random node positions at beginning of layout
  nodeDimensionsIncludeLabels: true, // Boolean which changes whether label dimensions are included when calculating node dimensions
  // TODO: this pans back out when enabled,  we may want to make this configurable
  fit: true, // Whether to fit
  padding: 20, // Padding on fit
  animate: true, // Whether to transition the node positions
  animateFilter: function (_node: any, _i: any) { return true; }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 500, // Duration of animation in ms if enabled
  animationEasing: undefined, // Easing of animation if enabled
  transform: function (_node: any, pos: any) { return pos; }, // A function that applies a transform to the final node position
  ready: undefined, // Callback on layoutready
  stop: undefined, // Callback on layoutstop
  nodeLayoutOptions: undefined, // Per-node options function
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
  priority: function (_edge: any) { return null; }, // Edges with a non-nil value are skipped when geedy edge cycle breaking is enabled
} as const;

export function getCytoscapeLayoutConfig(): cytoscape.LayoutOptions {
  const config = ELK_CONFIG;
  console.log(`using ${config.name} layout config`);
  Cytoscape.use(elk);
  return config;
}

