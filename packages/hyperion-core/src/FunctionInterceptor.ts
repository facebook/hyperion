import { Hook } from "@hyperion/hook";
import { defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";


type InterceptableFunction = (this: any, ...args: any) => any | { new(...args: any): any };
type InterceptableObjectType = { [key: string]: InterceptableFunction | any };

const unknownFunc: any = function () {
  console.warn('Unknown or missing function called! ');
}

class FunctionInterceptorBase<
  T extends InterceptableObjectType,
  Name extends string,
  FuncType extends T[Name] extends InterceptableFunction ? T[Name] : never,
  > extends PropertyInterceptor {
  public onValueObserver = new Hook<(value: ReturnType<FuncType>) => void>();
  public readonly original!: FuncType;
  public readonly interceptor: FuncType;

  constructor(name: Name, shadowPrototype: ShadowPrototype<T>) {
    super(name);

    this.interceptor = <FuncType>function (this: unknown) {
      const result = that.original.apply(this, arguments);
      that.onValueObserver.call.call(this, result);
      return result;
    }

    let propName = this.name;
    const desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, propName);
    if (
      desc
      && desc.value
    ) {
      this.original = desc.value;
      desc.value = this.interceptor;
      defineProperty(desc.container, propName, desc);
    } else {
      this.original = unknownFunc;
    }
    const that = this;
  }
}

/**
 * Function with 0 arity (https://en.wikipedia.org/wiki/Arity)
 */
export class NullaryFunctionInterceptor<Name extends string, T extends InterceptableObjectType>
  extends FunctionInterceptorBase<T, Name, T[Name]>  {
}

/**
 * Function with any arity (https://en.wikipedia.org/wiki/Arity)
 */
export class FunctionInterceptor<Name extends string, T extends InterceptableObjectType>
  extends NullaryFunctionInterceptor<Name, T> {
}
