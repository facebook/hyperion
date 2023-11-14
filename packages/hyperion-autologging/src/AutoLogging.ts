/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "@hyperion/global";
import global from "@hyperion/global/src/global";
import { Channel } from "@hyperion/hook/src/Channel";
import { initFlowletTrackers } from "@hyperion/hyperion-flowlet/src/FlowletWrappers";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import * as Types from "@hyperion/hyperion-util/src/Types";
import * as ALCustomEvent from "./ALCustomEvent";
import * as ALFlowletPublisher from "./ALFlowletPublisher";
import * as ALHeartbeat from "./ALHeartbeat";
import * as ALInteractableDOMElement from "./ALInteractableDOMElement";
import * as ALNetworkPublisher from "./ALNetworkPublisher";
import { ComponentNameValidator, setComponentNameValidator } from "./ALReactUtils";
import * as ALSurface from "./ALSurface";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";
import * as ALTriggerFlowlet from "./ALTriggerFlowlet";
import { ALSharedInitOptions } from "./ALType";
import * as ALUIEventGroupPublishers from "./ALUIEventGroupPublisher";
import * as ALUIEventPublisher from "./ALUIEventPublisher";
/**
 * This type extracts the union of all events types so that external modules
 * don't have to import these types one by one.
 */
export type ALChannelEvent = (
  ALFlowletPublisher.InitOptions['channel'] &
  ALSurface.InitOptions['channel'] &
  ALUIEventPublisher.InitOptions['channel'] &
  ALHeartbeat.InitOptions['channel'] &
  ALSurfaceMutationPublisher.InitOptions['channel'] &
  ALNetworkPublisher.InitOptions['channel'] &
  ALCustomEvent.ALCustomEventChannel
) extends Channel<infer EventType> ? EventType : never;

type PublicInitOptions<T> = Omit<T, keyof ALSharedInitOptions | 'react'>;

export type InitOptions = Types.Options<
  ALSharedInitOptions &
  {
    react: (ALSurface.InitOptions & ALTriggerFlowlet.InitOptions)['react'];
    enableReactComponentVisitors?: boolean;
    componentNameValidator?: ComponentNameValidator;
    flowletPublisher?: PublicInitOptions<ALFlowletPublisher.InitOptions> | null;
    surface: PublicInitOptions<ALSurface.InitOptions>;
    elementText?: ALInteractableDOMElement.ALElementTextOptions | null;
    uiEventPublisher?: PublicInitOptions<ALUIEventPublisher.InitOptions> | null;
    heartbeat?: ALHeartbeat.InitOptions | null;
    surfaceMutationPublisher?: PublicInitOptions<ALSurfaceMutationPublisher.InitOptions> | null;
    network?: PublicInitOptions<ALNetworkPublisher.InitOptions> | null;
    triggerFlowlet?: PublicInitOptions<ALTriggerFlowlet.InitOptions> | null;
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

  const sharedOptions: ALSharedInitOptions = {
    flowletManager: options.flowletManager,
    domSurfaceAttributeName: options.domSurfaceAttributeName,
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
  if (
    options.enableReactComponentVisitors ||
    (!options.surface.disableReactDomPropsExtension && options.react.enableInterceptDomElement) ||
    (options.triggerFlowlet && options.react.enableInterceptClassComponentMethods) ||
    (!options.triggerFlowlet?.disableReactFlowlet && (options.react.enableInterceptFunctionComponentRender || options.react.enableInterceptClassComponentConstructor))
  ) {
    IReactComponent.init(options.react);
  }

  if (options.elementText) {
    ALInteractableDOMElement.init(options.elementText);
  }

  if (options.flowletPublisher) {
    ALFlowletPublisher.publish(options.flowletPublisher);
  }

  if (options.uiEventPublisher) {
    ALUIEventPublisher.publish({
      ...sharedOptions,
      ...options.uiEventPublisher
    });
  }

  if (options.heartbeat) {
    ALHeartbeat.start(options.heartbeat);
  }

  if (options.surfaceMutationPublisher) {
    ALSurfaceMutationPublisher.publish({
      ...sharedOptions,
      ...options.surfaceMutationPublisher
    });
  }

  if (options.network) {
    ALNetworkPublisher.publish({
      ...sharedOptions,
      ...options.network
    });
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
