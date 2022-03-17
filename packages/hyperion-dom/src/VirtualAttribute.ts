import { AttributeInterceptorBase } from "@hyperion/hyperion-core/src/AttributeInterceptor";

export class VirtualAttribute<
  BaseType extends { [key: string]: any } = Element,
  Name extends string = string,
  GetRawValueType = string,
  SetRawValueType = GetRawValueType,
  GetProcessedValueType = GetRawValueType,
  SetProcessedValueType = SetRawValueType,
  > {
  constructor(
    public readonly rawValue: AttributeInterceptorBase<
      BaseType,
      Name,
      (this: BaseType) => GetRawValueType,
      (this: BaseType, value: SetRawValueType) => void
    >,
    public readonly processedValue: AttributeInterceptorBase<
      BaseType,
      Name,
      (this: BaseType) => GetProcessedValueType,
      (this: BaseType, value: SetProcessedValueType) => void
    >,
  ) {
  }

  getRawValue(obj: BaseType): GetRawValueType {
    return this.rawValue.getter.interceptor.call(obj);
  }

  setRawValue(obj: BaseType, value: SetRawValueType): void {
    return this.rawValue.setter.interceptor.call(obj, value);
  }

  getProcessedValue(obj: BaseType): GetProcessedValueType {
    return this.processedValue.getter.interceptor.call(obj);
  }

  setProcessedValue(obj: BaseType, value: SetProcessedValueType): void {
    return this.processedValue.setter.interceptor.call(obj, value);
  }

}