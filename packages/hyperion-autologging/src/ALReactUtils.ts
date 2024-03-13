/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

'use strict';

import { BailTraversalFunc } from "./ALElementInfo";

export type ReactComponentData = Readonly<{
  name: string | null,
  stack: Array<string>,
  isTruncated: boolean,
}>;

export type ComponentNameValidator = (name: string) => boolean;

export const defaultComponentNameValidator: ComponentNameValidator = (_: string) => {
  return true;
};


let componentNameValidator: ComponentNameValidator = defaultComponentNameValidator;
/**
 * Set a component validator function to use when extracting
 * a component name for the event's element, utilized in react component lookups.
 * The component stack will remain unfiltered, but component name linked must be valid via validator.
 * @param validator: callable passed a component name returning true if valid
 */
export function setComponentNameValidator(validator: ComponentNameValidator): void {
  componentNameValidator = validator;
}

type ReactInternalFiber = Readonly<{
  key: string | null,
  // memoizedProps can be any object
  memoizedProps: { [key: string]: any },
  return: ReactInternalFiber | null,
  type: string | ReactInternalFiberType | null,
  _debugSource: { fileName: string | null, lineNumber: number | null } | null,
}>;

type ReactInternalFiberType = Readonly<{
  displayName?: string,
  name?: string,
  render: ReactInternalFiberType,
}>;

const getReactInternalFiber = (element: Element): ReactInternalFiber | null => {
  let fiberKey: string | null = null;
  let listeningKeyFound = false;
  // Iterate the keys of the element, looking for react specific props
  // If this is a reactListening node, then fiber will not be available, attempt to grab fiber from the parent element.
  for (const key of Object.keys(element)) {
    if (key.startsWith('__reactFiber$')) {
      fiberKey = key;
      break;
      // Note this does not have the $ suffix, or begin with two _
    } else if (key.startsWith('_reactListening')) {
      listeningKeyFound = true;
    }
  }
  if (fiberKey == null && listeningKeyFound) {
    return getReactInternalFiber(element.parentElement as Element);
  }
  const el = element as { [k: string]: any };
  return fiberKey != null ? el[fiberKey] : null;
};

const getReactComponentName = (
  componentType: ReactInternalFiberType,
): string | null => {
  // Because of React name minimization in prod, we can't use componentType.name
  const displayName = componentType.displayName ?? componentType.name;
  if (displayName == null) {
    return null;
  }
  const match = displayName.match(/.*\[from (.*)\.react\]/);
  return match?.[1] ?? displayName;
};

export function getReactComponentData_THIS_CAN_BREAK(
  node: Element | null,
  bailTraversal?: BailTraversalFunc
): ReactComponentData | null {
  if (node == null) {
    return null;
  }

  const element: Element = node;
  try {
    let name: string | null = null;
    const stack: Array<string> = [];
    let fiber = getReactInternalFiber(element);
    let depth = 0;
    let isTruncated = false;
    while (fiber) {
      if (bailTraversal != null && bailTraversal(name != null, depth++)) {
        stack.push('...');
        isTruncated = true;
        break;
      }
      const fiberType = fiber.type;
      if (fiberType == null || typeof fiberType === 'string') {
        fiber = fiber.return;
        continue;
      }
      let componentName = getReactComponentName(fiberType);
      if (componentName == null && fiberType.render != null) {
        componentName = getReactComponentName(fiberType.render);
      }
      if (componentName != null && componentName !== '') {
        stack.push(componentName);
        if (name == null && componentNameValidator(componentName)) {
          name = componentName;
        }
      }
      fiber = fiber.return;
    }
    return stack.length > 0 ? { name, stack, isTruncated } : null;
  } catch (err) {
    if (__DEV__) {
      throw err;
    }
    return null;
  }
}
