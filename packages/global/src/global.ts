
import "./reference";

declare var window: Object;
declare var global: Object & {
  __DEV__?: boolean;
  process?: {
    env?: { [index: string]: any }
  }
};

if (
  typeof global === "object"
  && typeof __DEV__ !== "boolean"
) {
  if (
    global?.process?.env?.JEST_WORKER_ID ||
    global?.process?.env?.NODE_ENV === 'development'
  ) {
    global["__DEV__"] = true;
  }
}
