/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

'use strict';

export type ReactComponentData = Readonly<{
  name: string | null,
  stack: Array<string>,
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
  const key = Object.keys(element).find(key => key.startsWith('__reactFiber$'));
  const el = element as { [k: string]: any };
  return key != null ? el[key] : null;
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
): ReactComponentData | null {
  if (node == null) {
    return null;
  }

  const element: Element = node;
  try {
    let name: string | null = null;
    const stack: Array<string> = [];
    let fiber = getReactInternalFiber(element);
    while (fiber) {
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
    return stack.length > 0 ? { name, stack } : null;
  } catch (err) {
    if (__DEV__) {
      throw err;
    }
    return null;
  }
}
