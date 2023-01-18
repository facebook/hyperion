/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type {
  ReactComponentObjectProps, ReactElementComponentType, ReactForwardRefType,
  ReactMemoType, ReactNode, ReactSpecialComponent,
  ReactSpecialComponentTypes
} from './IReact';

import * as IReactConsts from './IReactConsts';

import React from "react";
import { mixed } from './FlowToTsTypes';

declare function FBLogger(prj: string): any;

type ReactElementNode = {
  $$typeof: symbol,
  type: mixed,
  props: ReactComponentObjectProps & { children?: ReactNode },
};

type VisitorFunc<
  ComponentType,
  PropsType,
  VisitorParamType,
  VisitorReturnType,
  NodeType
> = ((
  component: ComponentType,
  props: PropsType,
  param: VisitorParamType,
  node: NodeType,
) => VisitorReturnType | null | undefined) | null | undefined;

type ALReactElementVisitor<
  DomPropsType,
  ComponentPropsType,
  VisitorParamType,
  VisitorReturnType,
  NodeType,
> = {
  domElement?: VisitorFunc<
    string,
    DomPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,

  component?: VisitorFunc<
    ReactElementComponentType<ComponentPropsType>,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,

  forwardRef?: VisitorFunc<
    ReactForwardRefType<ComponentPropsType>,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,

  memo?: VisitorFunc<
    ReactMemoType<ComponentPropsType>,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,

  provider?: VisitorFunc<
    ReactSpecialComponent,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,

  context?: VisitorFunc<
    ReactSpecialComponent,
    ComponentPropsType,
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,

  fragment?: VisitorFunc<
    symbol,
    { children: ReactNode },
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,

  __default?: VisitorFunc<
    | string
    | ReactElementComponentType<ComponentPropsType>
    | ReactForwardRefType<ComponentPropsType>
    | ReactMemoType<ComponentPropsType>
    | ReactSpecialComponent
    | symbol,
    DomPropsType | ComponentPropsType | { children: ReactNode },
    VisitorParamType,
    VisitorReturnType,
    NodeType
  >,
};

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
): VisitorFunc<
  mixed,
  DomPropsType | ComponentPropsType | { children: ReactNode },
  VisitorParamType,
  VisitorReturnType,
  NodeType
> {
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
          case IReactConsts.REACT_CONTEXT_TYPE:
            visitor = visitors.context;
            break;
          default:
            FBLogger('ads_manager_auto_logging').warn(
              'skip object component $$type: %s',
              String(specialComp.$$typeof),
            );
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
          FBLogger('ads_manager_auto_logging').warn(
            'skip special component $$type: %s',
            String(component),
          );
          break;
      }
      break;
    default: {
      FBLogger('ads_manager_auto_logging').warn(
        'Did not know how to handle component type %s',
        typeof component,
      );
    }
  }

  visitor = visitor ?? visitors.__default;

  // $FlowIgnore[incompatible-return] 
  // @ts-ignore
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

  return visitor?.(
    component,
    // $FlowIgnore[incompatible-call]
    // @ts-ignore
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
    // $FlowIgnore[incompatible-exact]
    // $FlowIgnore[prop-missing]
    // $FlowIgnore[incompatible-variance]
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
            FBLogger('ads_manager_auto_logging').warn(
              'Unexpected object props type when skiping: %s',
              String($$typeof),
            );
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
          React.Children.forEach(node, child => {
            visited = true;
            visitNode(child, param, visitors);
          });
        } catch (e) {
          // FBLogger('ads_manager_auto_logging')
          //   .catching(e)
          //   .mustfix('Error during visiting children of react element');
        }

        if (!visited) {
          FBLogger('ads_manager_auto_logging').warn(
            'Unexpected child component type to skip: %s',
            String($$typeof),
          );
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
  return visitor;
}
