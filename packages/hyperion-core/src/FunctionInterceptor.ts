import { getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";


type InterceptableFunction = (this: any, ...args: any) => any | { new(...args: any): any };

const unknownFunc: any = function () {
  console.warn('Unknown or missing function called! ');
}

class FunctionInterceptorBase<FuncType extends InterceptableFunction> extends PropertyInterceptor {
  public readonly original!: FuncType;

  constructor(name: string, shadowPrototype: ShadowPrototype) {
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
export class NullaryFunctionInterceptor<FuncType extends InterceptableFunction> extends FunctionInterceptorBase<FuncType>  {
}

/**
 * Function with any arity (https://en.wikipedia.org/wiki/Arity)
 */
export class FunctionInterceptor<FuncType extends InterceptableFunction> extends NullaryFunctionInterceptor<FuncType> {
}
