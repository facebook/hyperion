/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ChannelEventType } from "@hyperion/hyperion-channel/src/Channel";
import { initFlowletTrackers } from "@hyperion/hyperion-flowlet/src/FlowletWrappers";
import { assert } from "@hyperion/hyperion-global";
import global from "@hyperion/hyperion-global/src/global";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import * as Types from "@hyperion/hyperion-util/src/Types";
import * as ALCustomEvent from "./ALCustomEvent";
import * as ALDOMSnapshotPublisher from "./ALDOMSnaptshotPublisher";
import * as ALElementValuePublisher from "./ALElementValuePublisher";
import * as ALFlowletPublisher from "./ALFlowletPublisher";
import * as ALHeartbeat from "./ALHeartbeat";
import * as ALHoverPublisher from "./ALHoverPublisher";
import * as ALInteractableDOMElement from "./ALInteractableDOMElement";
import * as ALNetworkPublisher from "./ALNetworkPublisher";
import { ComponentNameValidator, setComponentNameValidator } from "./ALReactUtils";
import * as ALSessionFlowID from "./ALSessionFlowID";
import * as ALSurface from "./ALSurface";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";
import * as ALSurfaceVisibilityPublisher from "./ALSurfaceVisibilityPublisher";
import * as ALTriggerFlowlet from "./ALTriggerFlowlet";
import { ALSharedInitOptions } from "./ALType";
import * as ALUIEventGroupPublishers from "./ALUIEventGroupPublisher";
import * as ALUIEventPublisher from "./ALUIEventPublisher";

/**
 * This type extracts the union of all events types so that external modules
 * don't have to import these types one by one.
 */
export type ALChannelEvent = ChannelEventType<
  ALFlowletPublisher.InitOptions['channel'] &
  ALSurface.InitOptions['channel'] &
  ALUIEventPublisher.InitOptions['channel'] &
  ALHeartbeat.InitOptions['channel'] &
  ALSurfaceMutationPublisher.InitOptions['channel'] &
  ALSurfaceVisibilityPublisher.InitOptions['channel'] &
  ALNetworkPublisher.InitOptions['channel'] &
  ALSessionFlowID.InitOptions['channel'] &
  ALCustomEvent.ALCustomEventChannel
>;

type PublicInitOptions<T> = Omit<T, keyof ALSharedInitOptions<never> | 'react'>;

export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelEvent> &
  {
    react: (ALSurface.InitOptions & ALTriggerFlowlet.InitOptions)['react'];
    enableReactComponentVisitors?: boolean;
    componentNameValidator?: ComponentNameValidator;
    flowletPublisher?: PublicInitOptions<ALFlowletPublisher.InitOptions> | null;
    surface: PublicInitOptions<ALSurface.InitOptions>;
    elementText?: ALInteractableDOMElement.ALElementTextOptions | null;
    uiEventPublisher?: PublicInitOptions<ALUIEventPublisher.InitOptions> | null;
    heartbeat?: PublicInitOptions<ALHeartbeat.InitOptions> | null;
    surfaceMutationPublisher?: PublicInitOptions<ALSurfaceMutationPublisher.InitOptions> | null;
    surfaceVisibilityPublisher?: PublicInitOptions<ALSurfaceVisibilityPublisher.InitOptions> | null;
    network?: PublicInitOptions<ALNetworkPublisher.InitOptions> | null;
    triggerFlowlet?: PublicInitOptions<ALTriggerFlowlet.InitOptions> | null;
    domSnapshotPublisher?: PublicInitOptions<ALDOMSnapshotPublisher.InitOptions> | null;
    sessionFlowID?: PublicInitOptions<ALSessionFlowID.InitOptions> | null;
  }
>;

export type InitResults = Readonly<{
  initOptions: InitOptions;
  surfaceRenderer: ALSurface.ALSurfaceHOC;
}>;

let cachedResults: InitResults | null = null;

/**
 *
 * @param options enables various features with their own init option
 * @returns true if initilized (the first time) or false if it is already initialized.
 */
export function init(options: InitOptions): boolean {
  if (cachedResults !== null) {
    return false;
  }

  if (options.componentNameValidator) {
    setComponentNameValidator(options.componentNameValidator);
  }

  const sharedOptions: ALSharedInitOptions<ALChannelEvent> = {
    flowletManager: options.flowletManager,
    channel: options.channel,
  }

  if (typeof global !== 'undefined' && (global as Window)?.document?.createElement != null) {
    initFlowletTrackers(options.flowletManager);
    options.triggerFlowlet && ALTriggerFlowlet.init({
      react: options.react,
      ...sharedOptions,
      ...options.triggerFlowlet,
    });
    ALUIEventGroupPublishers.init(options);

  }

  // Enumerating the cases where we need react interception and visitors
  const reactOptions = options.react;
  if (typeof reactOptions.enableInterceptDomElement !== 'boolean') {
    reactOptions.enableInterceptDomElement =
      options.surface.enableReactDomPropsExtension;
  }
  if (typeof reactOptions.enableInterceptClassComponentConstructor !== "boolean") {
    reactOptions.enableInterceptClassComponentConstructor =
      options.triggerFlowlet?.enableReactMethodFlowlet;
  }
  if (typeof reactOptions.enableInterceptClassComponentMethods !== "boolean") {
    reactOptions.enableInterceptClassComponentMethods =
      options.triggerFlowlet?.enableReactSetStateTracking ||
      options.triggerFlowlet?.enableReactMethodFlowlet;
  }
  if (typeof reactOptions.enableInterceptFunctionComponentRender !== "boolean") {
    reactOptions.enableInterceptFunctionComponentRender =
      options.triggerFlowlet?.enableReactMethodFlowlet
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

  if (options.sessionFlowID) {
    ALSessionFlowID.init({
      ...sharedOptions,
      ...options.sessionFlowID
    });
  }

  if (options.elementText) {
    ALInteractableDOMElement.init(options.elementText);
  }

  if (options.flowletPublisher) {
    ALFlowletPublisher.publish({
      ...sharedOptions,
      ...options.flowletPublisher
    });
  }

  if (options.surfaceMutationPublisher) {
    ALSurfaceMutationPublisher.publish({
      ...sharedOptions,
      ...options.surfaceMutationPublisher
    });
  }

  if (options.surfaceVisibilityPublisher) {
    ALSurfaceVisibilityPublisher.publish({
      ...sharedOptions,
      ...options.surfaceMutationPublisher
    });
  }

  if (options.uiEventPublisher) {
    ALUIEventPublisher.publish({
      ...sharedOptions,
      ...options.uiEventPublisher
    });

    ALHoverPublisher.publish({
      ...sharedOptions,
      ...options.uiEventPublisher,
    });

    /**
     * The following will depend on the surface mutation events
     * so we need to make sure it is initialized afterwards
     */
    ALElementValuePublisher.publish({
      ...sharedOptions,
      ...options.uiEventPublisher,
    });
  }

  if (options.heartbeat) {
    ALHeartbeat.start({
      ...sharedOptions,
      ...options.heartbeat,
    });
  }


  if (options.network) {
    ALNetworkPublisher.publish({
      ...sharedOptions,
      ...options.network
    });
  }

  if (options.domSnapshotPublisher) {
    ALDOMSnapshotPublisher.publish({
      ...sharedOptions,
      ...options.domSnapshotPublisher
    })
  }

  cachedResults = {
    initOptions: options,
    surfaceRenderer: ALSurface.init({
      react: options.react,
      ...sharedOptions,
      ...options.surface
    }),
  };

  return true;
}

export function getSurfaceRenderer(defaultALSurfaceHOC?: ALSurface.ALSurfaceHOC): ALSurface.ALSurfaceHOC {
  const renderer = cachedResults?.surfaceRenderer ?? defaultALSurfaceHOC;
  assert(
    renderer != null,
    "AutoLogging must have been initilized first. Did you forget to call .init() functions?",
    {
      logger: {
        error: msg => {
          console.error(msg);
          throw msg;
        }
      }
    }
  );
  return renderer;
}


/**
 * Gets the init options passed when initializing AutoLogging.
 * Can be useful to get configured channels, registered events, and other information after framework initialization.
 */
export function getInitOptions(): InitOptions {
  const options = cachedResults?.initOptions;
  assert(
    options != null,
    "AutoLogging must have been initilized first. Did you forget to call .init() functions?",
    {
      logger: {
        error: msg => {
          console.error(msg);
          throw msg;
        }
      }
    }
  );
  return options;
}
