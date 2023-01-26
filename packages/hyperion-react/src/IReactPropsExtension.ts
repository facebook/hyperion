/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IReact from "./IReact";
import TestAndSet from "./TestAndSet";
import * as IReactComponent from "./IReactComponent";

interface ExtendedProps<T> {
  __ext?: T;
}

type ExtensionGetter<T> = (props: ExtendedProps<T> | undefined) => T | undefined;

let initialized = new TestAndSet();
export function init<T>(
  IReactModule: IReact.IReactModuleExports,
  IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports,
  extensionCtor: () => T
): ExtensionGetter<T> {

  const extensionGetter: ExtensionGetter<T> = props => props?.__ext;

  if (initialized.testAndSet()) {
    return extensionGetter;
  }

  IReactComponent.init(IReactModule, IJsxRuntimeModule);


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