import {GenericFunctionInterceptor, interceptFunction} from "hyperion-core/src/FunctionInterceptor";

function isFunction(prop: any): boolean {
  return typeof prop === "function";
}

function _interceptReactProps(
  name: string,
  props: any,
): GenericFunctionInterceptor<any> | null {
  if (props[name] != null && isFunction(props[name])) {
    const funcInterceptor = interceptFunction(props[name]);
    props[name] = funcInterceptor.interceptor;
    return funcInterceptor;
  }
  return null;
}

type ReactNativePropsCallbacks =
  | "onBlur"
  | "onChange"
  | "onChangeText"
  | "onContentSizeChange"
  | "onEndEditing"
  | "onFocus"
  | "onHoverIn"
  | "onHoverOut"
  | "onKeyPress"
  | "onLayout"
  | "onLongPress"
  | "onPress"
  | "onPressIn"
  | "onPressMove"
  | "onPressOut"
  | "onScroll"
  | "onSelectionChange"
  | "onSubmitEditing";

type ReactPropsInterceptor = Record<ReactNativePropsCallbacks, GenericFunctionInterceptor<any> | null>;

export default function interceptReactProps(props: any): ReactPropsInterceptor {
  return {
    onBlur: _interceptReactProps("onBlur", props),
    onChange: _interceptReactProps("onChange", props),
    onChangeText: _interceptReactProps("onChangeText", props),
    onContentSizeChange: _interceptReactProps("onContentSizeChange", props),
    onEndEditing: _interceptReactProps("onEndEditing", props),
    onFocus: _interceptReactProps("onFocus", props),
    onHoverIn: _interceptReactProps("onHoverIn", props),
    onHoverOut: _interceptReactProps("onHoverOut", props),
    onKeyPress: _interceptReactProps("onKeyPress", props),
    onLayout: _interceptReactProps("onLayout", props),
    onLongPress: _interceptReactProps("onLongPress", props),
    onPress: _interceptReactProps("onPress", props),
    onPressIn: _interceptReactProps("onPressIn", props),
    onPressMove: _interceptReactProps("onPressMove", props),
    onPressOut: _interceptReactProps("onPressOut", props),
    onScroll: _interceptReactProps("onScroll", props),
    onSelectionChange: _interceptReactProps("onSelectionChange", props),
    onSubmitEditing: _interceptReactProps("onSubmitEditing", props),
  }
}
