/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { initFlowletTrackers } from 'hyperion-flowlet/src/FlowletWrappers';
import global from 'hyperion-globals/src/global';
import * as IReactComponent from 'hyperion-react/src/IReactComponent';
import * as ALDOMSnapshotPublisher from './ALDOMSnaptshotPublisher';
import * as ALElementValuePublisher from './ALElementValuePublisher';
import { ALFlowletManagerInstance } from './ALFlowletManager';
import * as ALFlowletPublisher from './ALFlowletPublisher';
import * as ALHeartbeat from './ALHeartbeat';
import * as ALHoverPublisher from './ALHoverPublisher';
import * as ALInteractableDOMElement from './ALInteractableDOMElement';
import * as ALNetworkPublisher from './ALNetworkPublisher';
import type { ALChannelPluginInit } from './ALPlugin';
import { setComponentNameValidator } from './ALReactUtils';
import * as ALSessionFlowID from './ALSessionFlowID';
import * as ALSurface from './ALSurface';
import * as ALSurfaceMutationPublisher from './ALSurfaceMutationPublisher';
import * as ALSurfaceProxy from './ALSurfaceProxy';
import * as ALSurfaceVisibilityPublisher from './ALSurfaceVisibilityPublisher';
import * as ALTriggerFlowlet from './ALTriggerFlowlet';
import * as ALUIEventPublisher from './ALUIEventPublisher';
import type { ALChannelEvent, InitOptions } from './AutoLogging';

export function createWebAutoLoggingPlugins(
  options: InitOptions
): readonly ALChannelPluginInit<ALChannelEvent>[] {
  return [
    () => {
      if (options.componentNameValidator) {
        setComponentNameValidator(options.componentNameValidator);
      }
    },
    (channel) => {
      if (
        typeof global !== 'undefined' &&
        (global as Window)?.document?.createElement != null
      ) {
        initFlowletTrackers(ALFlowletManagerInstance);
        if (options.triggerFlowlet) {
          ALTriggerFlowlet.init({
            react: options.react,
            channel,
            ...options.triggerFlowlet,
          });
        }
      }
    },
    () => {
      const reactOptions = options.react;
      if (
        typeof reactOptions.enableInterceptClassComponentConstructor !==
        'boolean'
      ) {
        reactOptions.enableInterceptClassComponentConstructor =
          options.triggerFlowlet?.enableReactMethodFlowlet;
      }
      if (
        typeof reactOptions.enableInterceptClassComponentMethods !== 'boolean'
      ) {
        reactOptions.enableInterceptClassComponentMethods =
          options.triggerFlowlet?.enableReactSetStateTracking ||
          options.triggerFlowlet?.enableReactMethodFlowlet;
      }
      if (
        typeof reactOptions.enableInterceptFunctionComponentRender !== 'boolean'
      ) {
        reactOptions.enableInterceptFunctionComponentRender =
          options.triggerFlowlet?.enableReactMethodFlowlet;
      }
      if (
        options.enableReactComponentVisitors ||
        reactOptions.enableInterceptClassComponentConstructor ||
        reactOptions.enableInterceptClassComponentMethods ||
        reactOptions.enableInterceptDomElement ||
        reactOptions.enableInterceptFunctionComponentRender
      ) {
        IReactComponent.init(options.react);
      }
    },
    (channel) => {
      if (options.sessionFlowID) {
        ALSessionFlowID.init({
          channel,
          ...options.sessionFlowID,
        });
      }
    },
    () => {
      if (options.elementText) {
        ALInteractableDOMElement.init(options.elementText);
      }
    },
    (channel) => {
      if (options.flowletPublisher) {
        ALFlowletPublisher.publish({
          channel,
          ...options.flowletPublisher,
        });
      }
    },
    (channel) => {
      if (options.surfaceMutationPublisher) {
        ALSurfaceMutationPublisher.publish({
          channel,
          ...options.surfaceMutationPublisher,
        });
      }
    },
    (channel) => {
      if (options.surfaceVisibilityPublisher) {
        ALSurfaceVisibilityPublisher.publish({
          channel,
          ...options.surfaceVisibilityPublisher,
        });
      }
    },
    (channel) => {
      if (options.uiEventPublisher) {
        ALUIEventPublisher.publish({
          channel,
          ...options.uiEventPublisher,
        });

        ALHoverPublisher.publish({
          channel,
          ...options.uiEventPublisher,
        });

        /**
         * The value publisher depends on surface mutation events and must be
         * initialized after the other UI publishers.
         */
        ALElementValuePublisher.publish({
          channel,
          ...options.uiEventPublisher,
        });
      }
    },
    (channel) => {
      if (options.heartbeat) {
        ALHeartbeat.start({
          channel,
          ...options.heartbeat,
        });
      }
    },
    (channel) => {
      if (options.network) {
        ALNetworkPublisher.publish({
          channel,
          ...options.network,
        });
      }
    },
    (channel) => {
      if (options.domSnapshotPublisher) {
        ALDOMSnapshotPublisher.publish({
          channel,
          ...options.domSnapshotPublisher,
        });
      }
    },
    (channel) => {
      ALSurface.init({
        channel,
        ...options.surface,
      });
    },
    () => {
      ALSurfaceProxy.init({ react: options.react });
    },
  ];
}
