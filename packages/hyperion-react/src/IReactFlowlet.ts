/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type * as Types from "hyperion-util/src/Types";

import { assert } from "hyperion-globals";
import { Flowlet } from "hyperion-flowlet/src/Flowlet";
import { FlowletManager } from "hyperion-flowlet/src/FlowletManager";
import * as IReactComponent from "hyperion-react/src/IReactComponent";
import TestAndSet from "hyperion-test-and-set/src/TestAndSet";
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
  // Define a type for the component with the flowlet property.
// Replace 'any' with the actual type of your component if known.
interface ComponentWithFlowlet extends React.Component {
  props: {
    // Replace with the actual type of your props.
    [key: string]: any;
  };
}

// A helper function to apply the flowlet logic.
const applyFlowletInterceptor = (method: Function): void => {
  // Check if the method has already been set up.
  if (method.testAndSet(IS_FLOWLET_SETUP_PROP)) {
    return;
  }

  /**
   * The interceptor methods run before & after the intercepted method.
   * This allows us to push the flowlet before the method's body
   * and pop it after the method has finished executing.
   */
  method.onBeforeAndAfterCallMapperAdd(function(this: ComponentWithFlowlet) {
    const activeCallFlowlet = flowletPusher(this.props);
    return (value: any) => {
      if (activeCallFlowlet) {
        flowletManager.pop(activeCallFlowlet);
      }
      return value;
    };
  });
};

const methods: Function[] = [
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

// Apply the flowlet logic to each method.
methods.forEach(applyFlowletInterceptor);

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
