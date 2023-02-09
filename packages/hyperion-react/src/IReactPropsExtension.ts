/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type * as Types from "@hyperion/hyperion-util/src/Types";
import * as IReactComponent from "./IReactComponent";
import TestAndSet from "./TestAndSet";

export interface ExtendedProps<T> extends React.PropsWithChildren {
  __ext?: T;
}

type ExtensionGetter<T> = (props: ExtendedProps<T> | undefined) => T | undefined;


export type InitOptions<T> = Types.Options<
  IReactComponent.InitOptions &
  {
    extensionCtor: () => T;
    disableReactPropsExtension?: boolean;
  }
>;


let initialized = new TestAndSet();
export function init<T>(options: InitOptions<T>): ExtensionGetter<T> {

  const extensionGetter: ExtensionGetter<T> = props => props?.__ext;

  if (initialized.testAndSet() || options.disableReactPropsExtension) {
    return extensionGetter;
  }

  IReactComponent.init(options);

  const { extensionCtor } = options;

  function updatePropsExtension(
    _component: unknown,
    props: ExtendedProps<T>,
  ) {
    let ext = props.__ext;
    if (!ext) {
      props.__ext = extensionCtor();
    }
  }

  IReactComponent.onReactClassComponentElement.add(updatePropsExtension);
  IReactComponent.onReactFunctionComponentElement.add(updatePropsExtension);
  IReactComponent.onReactSpecialObjectElement.add(updatePropsExtension);

  return extensionGetter;
}