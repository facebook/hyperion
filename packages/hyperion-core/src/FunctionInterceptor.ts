import { getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
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
  public readonly original!: FuncType;

  constructor(name: Name, shadowPrototype: ShadowPrototype<T>) {
    super(name);
    let propName = this.name;
    const desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, propName);
    if (
      desc
      && desc.value
    ) {
      this.original = desc.value;
    } else {
      this.original = unknownFunc;
    }
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
