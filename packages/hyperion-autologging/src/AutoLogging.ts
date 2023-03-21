/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "@hyperion/global";
import { Channel } from "@hyperion/hook/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import * as ALHeartbeat from "./ALHeartbeat";
import * as ALNetworkPublisher from "./ALNetworkPublisher";
import { ComponentNameValidator, setComponentNameValidator } from "./ALReactUtils";
import * as ALSurface from "./ALSurface";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";
import { ALSharedInitOptions } from "./ALType";
import * as ALUIeventPublisher from "./ALUIEventPublisher";

/**
 * This type extracts the union of all events types so that external modules
 * don't have to import these types one by one.
 */
export type ALChannelEvent = (
  ALSurface.InitOptions['channel'] &
  ALUIeventPublisher.InitOptions['channel'] &
  ALHeartbeat.InitOptions['channel'] &
  ALSurfaceMutationPublisher.InitOptions['channel'] &
  ALNetworkPublisher.InitOptions['channel']
) extends Channel<infer EventType> ? EventType : never;

type PublicInitOptions<T> = Omit<T, keyof ALSharedInitOptions>;

export type InitOptions = Types.Options<
  ALSharedInitOptions &
  {
    componentNameValidator?: ComponentNameValidator;
    surface: PublicInitOptions<ALSurface.InitOptions>;
    uiEventPublisher?: PublicInitOptions<ALUIeventPublisher.InitOptions>;
    heartbeat?: ALHeartbeat.InitOptions;
    surfaceMutationPublisher?: PublicInitOptions<ALSurfaceMutationPublisher.InitOptions>;
    network?: PublicInitOptions<ALNetworkPublisher.InitOptions>;
  }
>;

export type InitResults = Readonly<{
  surfaceRenderer: ALSurface.ALSurfaceHOC;
}>;

let cachedResults: InitResults | null = null;

export function init(options: InitOptions): InitResults {
  if (cachedResults !== null) {
    return cachedResults;
  }

  if (options.componentNameValidator) {
    setComponentNameValidator(options.componentNameValidator);
  }

  const sharedOptions: ALSharedInitOptions = {
    flowletManager: options.flowletManager,
    domSurfaceAttributeName: options.domSurfaceAttributeName,
  }

  if (options.uiEventPublisher) {
    ALUIeventPublisher.publish({
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
    surfaceRenderer: ALSurface.init({
      ...sharedOptions,
      ...options.surface
    }),
  };

  return cachedResults;
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
