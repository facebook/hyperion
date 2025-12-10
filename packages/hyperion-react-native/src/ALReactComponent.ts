/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type { Channel } from "hyperion-channel/src/Channel";
import type * as Types from "hyperion-util/src/Types";

import * as IReactComponent from "hyperion-react/src/IReactComponent";

'use strict';

type ALSurfaceEventData = {
    surface: string,
    args: any[],
};

type ALSurfaceChannel = Readonly<{
  al_react_component_mount: [ALSurfaceEventData],
}>;

export type InitOptions = Types.Options<{
  channel: Channel<ALSurfaceChannel>;

  enableReactComponentPublisher?: boolean;
}>;


export function publish(options: InitOptions): void {
  const RENDER_INTERCEPTED = '__IS_RENDER_INTERCEPTED__REACT_NATIVE';

  const { channel } = options;

  IReactComponent.onReactClassComponentIntercept.add(shadow => {
    if (!options.enableReactComponentPublisher) {
      return;
    }

    const render = shadow.render;
    if (render.testAndSet(RENDER_INTERCEPTED)) {
      return;
    }

    const surface = render.getOriginal().name ?? shadow.name;

    render.onBeforeCallObserverAdd(function (this: any, ...args: any[]) {
      channel.emit("al_react_component_mount", {
        surface,
        args,
      });
    });
  })

  IReactComponent.onReactFunctionComponentIntercept.add(render => {
    if (!options.enableReactComponentPublisher || render.testAndSet(RENDER_INTERCEPTED)) {
      return;
    }

    const surface = render.getOriginal().displayName ?? render.name;

    render.onBeforeCallObserverAdd(function (this: any, ...args: any[]) {
      channel.emit("al_react_component_mount", {
        surface,
        args,
      });
    });
  });
}
