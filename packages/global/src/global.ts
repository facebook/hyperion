
import "./reference";

declare var window: Object;
declare var global: Object & {__DEV__?: boolean};

if (
  typeof global === "object"
  && typeof window !== "object"
  && typeof __DEV__ !== "boolean"
) {
  if (typeof global["__DEV__"] !== "boolean") {
    global["__DEV__"] = false;
  }
}
