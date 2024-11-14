/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type * as Types from "hyperion-util/src/Types";
import type React from "react";
import type {
  ReactComponentObjectProps, ReactElementComponentType, ReactForwardRefType,
  ReactMemoType, ReactNode, ReactSpecialComponent,
  ReactSpecialComponentTypes
} from './IReact';

import { $Values, mixed } from './FlowToTsTypes';
import * as IReactConsts from './IReactConsts';

function warn(msg: string): void {
  if (__DEV__) {
    console.warn(msg);
  }
}

type ReactElementNode = {
  $$typeof: symbol,
  type: mixed,
  props: ReactComponentObjectProps & { children?: ReactNode },
};

type VisitorFunc<
  in ComponentType,
  in PropsType,
  in VisitorParamType,
  out VisitorReturnType,
  in NodeType
> = ((
  component: ComponentType,
  props: PropsType,
  param: VisitorParamType,
  node?: NodeType,
) => VisitorReturnType | null | undefined);


type VisitorComponentTypes<ComponentPropsType> = {
  domElement: string,
  component: ReactElementComponentType<ComponentPropsType>,
  forwardRef: ReactForwardRefType<ComponentPropsType>,
  memo: ReactMemoType<ComponentPropsType>,
  provider: ReactSpecialComponent,
  context: ReactSpecialComponent,
  fragment: symbol,
};

type VisitorComponentPropsTypes<DomPropsType, ComponentPropsType> = {
  domElement: DomPropsType,
  component: ComponentPropsType,
  forwardRef: ComponentPropsType,
  memo: ComponentPropsType,
  provider: ComponentPropsType,
  context: ComponentPropsType,
  fragment: { children: ReactNode; __ext: never },
};

type ALReactElementVisitor<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
  NodeType,
> =
  {
    [Key in keyof VisitorComponentTypes<ComponentPropsType>]?: VisitorFunc<
      VisitorComponentTypes<ComponentPropsType>[Key],
      VisitorComponentPropsTypes<DomPropsType, ComponentPropsType>[Key],
      VisitorParamType,
      VisitorReturnType,
      NodeType>;
  } & {
    __default?: VisitorFunc<
      $Values<VisitorComponentTypes<ComponentPropsType>>,
      $Values<VisitorComponentPropsTypes<DomPropsType, ComponentPropsType>>,
      VisitorParamType,
      VisitorReturnType,
      NodeType
    >;

    _get?: (
      component: mixed,
      visitors: ALReactElementVisitor<
        DomPropsType,
        ComponentPropsType,
        VisitorParamType,
        VisitorReturnType,
        NodeType
      >,
    ) => $Values<ALReactElementVisitor<
      DomPropsType,
      ComponentPropsType,
      VisitorParamType,
      VisitorReturnType,
      NodeType
    >>
  };

function optimizeVisitors<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
  NodeType,
>(
  visitors: ALReactElementVisitor<
    DomPropsType,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,
): void {
  type Visitors = ALReactElementVisitor<
    DomPropsType,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >;

  function callVtable(
    index: string | symbol,
    component: mixed,
    visitors: Visitors,
  )/* : $Values<Visitors> | undefined  */ {
    const getter = vtable[index];
    if (getter) {
      return getter(component, visitors);
    } else {
      warn(`optimized visitors missing entry for ${String(index)}`);
    }
    return;
  }

  type VisitorGetter<K extends keyof VisitorComponentTypes<ComponentPropsType>> = (
    component: VisitorComponentTypes<ComponentPropsType>[K],
    visitors: Visitors,
  ) => Visitors[K] | undefined | null;

  function ctor<K extends keyof VisitorComponentTypes<ComponentPropsType>>(
    visitorName?: K,
  ): VisitorGetter<K> {
    if (visitorName != null && visitors[visitorName] != null) {
      // This visitor exists, so we can use it
      return (_, visitors) => visitors[visitorName];
    } else {
      // Use the __default visitor instead
      return (_, visitors) => visitors.__default;
    }
  }

  const vtable: {
    string: VisitorGetter<'domElement'>,
    function: VisitorGetter<'component'>,
    object: VisitorGetter<'forwardRef' | 'memo' | 'provider' | 'context'>,
    symbol: VisitorGetter<'fragment'>,
    [key: string | symbol]:
    (component: mixed, visitors: Visitors) => mixed
    // VisitorGetter<Exclude<keyof Visitors, "__default" | "__get">>,
  } = {
    string: ctor('domElement'),
    function: ctor('component'),
    object: (component, visitors) =>
      callVtable(component?.$$typeof, component, visitors),
    symbol: (component, visitors) =>
      callVtable(component, component, visitors),
    [IReactConsts.REACT_FORWARD_REF_TYPE]: ctor('forwardRef'),
    [IReactConsts.REACT_MEMO_TYPE]: ctor('memo'),
    [IReactConsts.REACT_PROVIDER_TYPE]: ctor('provider'),
    [IReactConsts.REACT_CONSUMER_TYPE]: ctor('context'), // this is same as 'context'
    [IReactConsts.REACT_CONTEXT_TYPE]: ctor('context'),
    [IReactConsts.REACT_FRAGMENT_TYPE]: ctor('fragment'),
    [IReactConsts.REACT_SUSPENSE_TYPE]: ctor(),
    [IReactConsts.REACT_SUSPENSE_LIST_TYPE]: ctor(),
    [IReactConsts.REACT_PROFILER_TYPE]: ctor(),
    [IReactConsts.REACT_LEGACY_HIDDEN_TYPE]: ctor(),
    [IReactConsts.REACT_SCOPE_TYPE]: ctor(),
    [IReactConsts.REACT_STRICT_MODE_TYPE]: ctor(),
  };

  visitors._get = (component, visitors) =>
    callVtable(typeof component, component, visitors);
}

export type InitOptions = Types.Options<
  {
    ReactModule: {
      Children: typeof React.Children;
    }
  }
>;

let ReactModule: InitOptions['ReactModule'] | null = null;
export function init(options: InitOptions) {
  ReactModule = options.ReactModule;
}

function getVisitor<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
  NodeType,
>(
  component: mixed,
  visitors: ALReactElementVisitor<
    DomPropsType,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,
): $Values<ALReactElementVisitor<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
  NodeType
>> {
  const optVisitor = visitors._get?.(component, visitors);

  if (optVisitor || !visitors.__default) {
    // either we found something, or there was no default.
    return optVisitor;
  }

  // Otherwise, let's try the old way!
  let visitor;

  switch (typeof component) {
    case 'string':
      visitor = visitors.domElement;
      break;
    case 'function':
      visitor = visitors.component;
      break;
    case 'object':
      {
        if (!component) {
          break;
        }
        /**
         * This is a component object, e.g. from createForwardRef(...)
         * React still process it as if it was a functional component
         */
        const specialComp: Partial<ReactSpecialComponentTypes<ComponentPropsType>> =
          // $FlowIgnore[incompatible-type] // https://fb.workplace.com/groups/flow/permalink/9565274296854433/
          component;

        switch (specialComp.$$typeof) {
          case IReactConsts.REACT_FORWARD_REF_TYPE:
            visitor = visitors.forwardRef;
            break;
          case IReactConsts.REACT_MEMO_TYPE:
            visitor = visitors.memo;
            break;
          case IReactConsts.REACT_PROVIDER_TYPE:
            visitor = visitors.provider;
            break;
          case IReactConsts.REACT_CONSUMER_TYPE:
          case IReactConsts.REACT_CONTEXT_TYPE:
            visitor = visitors.context;
            break;
          default:
            warn(`skip object component $$type: ${String(specialComp.$$typeof)}`);
            break;
        }
      }
      break;
    case 'symbol':
      switch (component) {
        case IReactConsts.REACT_FRAGMENT_TYPE:
          /**
           * do we need to recurse inside? probably not, each child itself should
           * be called by the jsx* api
           */
          visitor = visitors.fragment;
          break;
        case IReactConsts.REACT_SUSPENSE_TYPE:
          /**
           * props is {fallback, suspenseCallback}
           * probably need to interncep those
           */
          break;
        case IReactConsts.REACT_PROFILER_TYPE:
          break;
        case IReactConsts.REACT_LEGACY_HIDDEN_TYPE:
          /**
           * props is {children, ...}
           * assumption is those are already processed before
           */
          break;
        case IReactConsts.REACT_SCOPE_TYPE:
          break;
        case IReactConsts.REACT_STRICT_MODE_TYPE:
          break;
        default:
          warn(`skip special component $$type: ${String(component)}`);
          break;
      }
      break;
    default: {
      warn(`Did not know how to handle component type ${typeof component}`);
    }
  }

  visitor = visitor ?? visitors.__default;

  return visitor;
}

function visitElement<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
  NodeType,
>(
  component: mixed,
  props: mixed,
  param: VisitorParamType,
  visitors: ALReactElementVisitor<
    DomPropsType,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,
  node?: NodeType,
): VisitorReturnType | null | undefined {
  const visitor = getVisitor(component, visitors);

  // @ts-ignore
  return visitor?.(
    // @ts-ignore
    component,
    props,
    param,
    node,
  );
}

export function createReactElementVisitor<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
>(
  visitors: ALReactElementVisitor<
    DomPropsType,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    void
  >,
): (
  component: mixed,
  props: DomPropsType | ComponentPropsType,
  param: VisitorParamType,
) => VisitorReturnType | null | undefined {
  optimizeVisitors(visitors);

  return (component, props, param) =>
    visitElement(component, props, param, visitors);
}

function visitNode<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
>(
  node: ReactNode,
  param: VisitorParamType,
  visitors: ALReactElementVisitor<
    DomPropsType,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    ReactElementNode
  >,
): VisitorReturnType | null | undefined {
  if (
    typeof node !== 'object' ||
    node == null ||
    node instanceof Node // See this: https://fb.workplace.com/groups/reactjs/permalink/9019994061382462/
  ) {
    return;
  }

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; ++i) {
      visitNode(node[i], param, visitors);
    }
  } else {
    // @ts-ignore
    const element: ReactElementNode = node;

    const $$typeof = element.$$typeof;
    switch ($$typeof) {
      case IReactConsts.REACT_ELEMENT_TYPE:
      case IReactConsts.REACT_FORWARD_REF_TYPE: {
        const props = element.props;
        if (!props || typeof props !== 'object') {
          return;
        }

        return visitElement(element.type, props, param, visitors, element);
      }
      case IReactConsts.REACT_PORTAL_TYPE:
        // return visitNode(node.children, param, visitors);
        return;
      case IReactConsts.REACT_MEMO_TYPE:
      case IReactConsts.REACT_PROVIDER_TYPE:
        // These component won't have children so safe to skip
        if (__DEV__) {
          if (typeof element.props === 'object') {
            warn(`Unexpected object props type when skiping: ${String($$typeof)}`);
          }
        }
        return;
      default: {
        /**
         * We have tried every known option so far, now we can try the builtin
         * React mechanism to visit the node.
         * the React.Children.forEach is expensive and creates extra array objects
         * during iteration. Therefore, we should regularly try to minimize the
         * reliance on this code.
         */
        let visited = false;
        try {
          ReactModule?.Children.forEach(node, child => {
            visited = true;
            visitNode(child, param, visitors);
          });
        } catch (e) {
          // FBLogger('ads_manager_auto_logging')
          //   .catching(e)
          //   .mustfix('Error during visiting children of react element');
        }

        if (!visited) {
          warn(`Unexpected child component type to skip: ${String($$typeof)}`);
        }
        break;
      }
    }
  }
  return;
}

type ElementVisitor<VisitorParamType, VisitorReturnType> = (
  node: ReactNode,
  param: VisitorParamType,
) => VisitorReturnType | null | undefined;

export function createReactNodeVisitor<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
>(
  visitors: ALReactElementVisitor<
    DomPropsType,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    ReactElementNode
  >,
): ElementVisitor<VisitorParamType, VisitorReturnType> {
  const visitor: ElementVisitor<VisitorParamType, VisitorReturnType> = (
    node,
    param,
  ) => visitNode(node, param, visitors);
  if (!visitors.fragment) {
    visitors.fragment = (_comp, props, param, _node) =>
      visitor(props.children, param);
  }
  optimizeVisitors(visitors);
  return visitor;
}
