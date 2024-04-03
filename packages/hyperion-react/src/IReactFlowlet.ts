/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type * as Types from "@hyperion/hyperion-util/src/Types";

import { assert } from "@hyperion/hyperion-global";
import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import TestAndSet from "@hyperion/hyperion-util/src/TestAndSet";
import * as IReact from "./IReact";
import * as IReactPropsExtension from "./IReactPropsExtension";

export interface FlowletDataType {
  // Technically anyone else can extend this interface for their expected data
};


export class PropsExtension<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>
> {
  callFlowlet: FlowletType;

  constructor(callFlowlet: FlowletType) {
    this.callFlowlet = callFlowlet;
  }

  toString(): string {
    return this.callFlowlet.getFullName();
  }
}


export type InitOptions<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>,
> = Types.Options<
  Omit<IReactPropsExtension.InitOptions<any>, "extensionCtor"> &
  {
    IReactModule: IReact.IReactModuleExports;
    IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports;
    flowletManager: FlowletManagerType;
    disableReactFlowlet?: boolean;
  }
>;

let initialized = new TestAndSet();
export function init<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>,
>(options: InitOptions<DataType, FlowletType, FlowletManagerType>) {
  if (initialized.testAndSet() || options.disableReactFlowlet) {
    return;
  }
  const { flowletManager } = options;

  assert(
    flowletManager.flowletCtor != null,
    '[AL]FlowletManager does not have a flowlet constructor.',
  );


  const extensionGetter = IReactPropsExtension.init({
    ...options,
    extensionCtor: () => {
      const callFlowlet = flowletManager.top();
      return callFlowlet ? new PropsExtension(callFlowlet) : null
    }
  });

  type ExtendedProps = IReactPropsExtension.ExtendedProps<PropsExtension<DataType, FlowletType>>;
  type InterceptedProps = IReact.ReactComponentObjectProps & ExtendedProps;
  type ComponentWithFlowlet = React.Component<InterceptedProps>;

  function flowletPusher(props?: ExtendedProps): FlowletType | undefined {
    const extension = extensionGetter(props);
    const activeCallFlowlet = extension?.callFlowlet;
    if (activeCallFlowlet) {
      flowletManager.push(activeCallFlowlet);
    }
    return activeCallFlowlet;
  }

  const IS_FLOWLET_SETUP_PROP = 'isFlowletSetup';

  IReactComponent.onReactClassComponentIntercept.add(shadowComponent => {
    const methods = [
      shadowComponent.render,
      shadowComponent.componentWillMount,
      shadowComponent.componentDidMount,
      shadowComponent.componentWillReceiveProps,
      shadowComponent.shouldComponentUpdate,
      shadowComponent.componentWillUpdate,
      shadowComponent.componentDidUpdate,
      shadowComponent.componentWillUnmount,
      shadowComponent.componentDidCatch,
    ];

    methods.forEach(method => {
      if (method.testAndSet(IS_FLOWLET_SETUP_PROP)) {
        return;
      }

      /**
       * The following interceptor methods run immediately before & after
       * intercepted method. So, we can push before and pop after so that
       * the body of the method has access to flowlet.
       * We will expand these methods to other lifecycle methods later.
       */
      method.onBeforeAndAfterCallMapperAdd(function (this: ComponentWithFlowlet) {
        const activeCallFlowlet = flowletPusher(this.props);
        return (value) => {
          if (activeCallFlowlet) {
            flowletManager.pop(activeCallFlowlet);
          }
          return value;
        }
      });

    });
  });

  IReactComponent.onReactFunctionComponentIntercept.add(
    fi => {
      if (fi.testAndSet(IS_FLOWLET_SETUP_PROP)) {
        return;
      }
      fi.onBeforeAndAfterCallMapperAdd(([props]) => {
        const activeCallFlowlet = flowletPusher(props);
        return (value) => {
          if (activeCallFlowlet) {
            flowletManager.pop(activeCallFlowlet);
          }
          return value;
        }
      });
    },
  );

}
