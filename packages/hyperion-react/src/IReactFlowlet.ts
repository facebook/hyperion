/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import TestAndSet from "./TestAndSet";

import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
import * as IReact from "./IReact";
import * as IReactPropsExtension from "./IReactPropsExtension";
import { assert } from "@hyperion/global";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";

/**
 * We want to allow type of flowlet to be passed here. the only thing we need
 * from the data type is the `surface` field. Sonce, ALFlowlet may change
 * overtime, we don't want to create an uncessary dependency on that.
 */
export interface FlowletDataType {
  surface?: string,
};


let _globalExtId = 0;
export class PropsExtension<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>
> {
  readonly id: number = _globalExtId++; // Useful for debugging
  flowlet: FlowletType;

  constructor(flowlet: FlowletType) {
    this.flowlet = flowlet;
  }

  toString(): string {
    return this.flowlet.getFullName();
  }
}


let initialized = new TestAndSet();
export function init<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>,
>(
  IReactModule: IReact.IReactModuleExports,
  IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports,
  flowletManager: FlowletManagerType,
) {
  if (initialized.testAndSet()) {
    return;
  }

  assert(
    flowletManager.flowletCtor != null,
    '[AL]FlowletManager does not have a flowlet constructor.',
  );


  const extensionGetter = IReactPropsExtension.init(IReactModule, IJsxRuntimeModule, () => {
    const top = flowletManager.top();
    return top ? new PropsExtension(top) : null
  });

  type ExtendedProps = IReactPropsExtension.ExtendedProps<PropsExtension<DataType, FlowletType>>;
  type InterceptedProps = IReact.ReactComponentObjectProps & ExtendedProps;
  type ComponentWithFlowlet = React.Component<InterceptedProps>;

  function flowletPusher(props?: ExtendedProps): FlowletType | undefined {
    const extension = extensionGetter(props);
    const activeFlowlet = extension?.flowlet;
    if (activeFlowlet) {
      flowletManager.push(activeFlowlet);
    }
    return activeFlowlet;
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
      if (method.getData<boolean>(IS_FLOWLET_SETUP_PROP)) {
        return;
      }
      method.setData(IS_FLOWLET_SETUP_PROP, true);

      /**
       * The following interceptor methods run immediately before & after
       * intercepted method. So, we can push before and pop after so that
       * the body of the method has access to flowlet.
       * We will expand these methods to other lifecycle methods later.
       */
      let activeFlowlet: FlowletType | undefined | null;
      method.onArgsObserverAdd(function (this: ComponentWithFlowlet) {
        activeFlowlet = flowletPusher(this.props);
      });
      method.onValueObserverAdd(function (this: ComponentWithFlowlet) {
        if (activeFlowlet) {
          flowletManager.pop(activeFlowlet);
        }
      });
    });
  });

  IReactComponent.onReactFunctionComponentIntercept.add(
    fi => {
      if (!fi.getData<boolean>(IS_FLOWLET_SETUP_PROP)) {
        fi.setData(IS_FLOWLET_SETUP_PROP, true);

        let activeFlowlet: FlowletType | undefined | null;
        fi.onArgsObserverAdd(props => {
          activeFlowlet = flowletPusher(props);
        });
        fi.onValueObserverAdd(() => {
          if (activeFlowlet) {
            flowletManager.pop(activeFlowlet);
          }
        });
      }
    },
  );

}