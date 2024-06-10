/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
// import React, {useState, useCallback, useRef, useEffect} from "react";
import type cytoscape from 'cytoscape';

export const defaultStylesheet: cytoscape.StylesheetStyle[] = [
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

export const nodeColor = (name: string) => NodeColorMap.get(name) ?? 'gray';

const EdgeColorMap = new Map([
  ['flowlet', 'red'],
  ['seq', 'black'],
  ['ce', 'blue']
]);

export const edgeColor = (name: string) => EdgeColorMap.get(name) ?? 'gray';

