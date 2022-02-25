import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { PropertyInterceptor } from "./PropertyInterceptor";

type Extension = {
};


export class ShadowPrototype<ObjectType extends Object = any, ParentType extends Object = any> {
  readonly extension: Extension;
  readonly onBeforInterceptObj = new Hook<(obj: ObjectType) => void>();
  readonly onAfterInterceptObj = new Hook<(obj: ObjectType) => void>();
  private pendingPropertyInterceptors?: PropertyInterceptor[];

  constructor(
    public readonly targetPrototype: ObjectType,
    private readonly parentShadoPrototype: ShadowPrototype<ParentType> | null,
  ) {
    /**
     * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
     * in the following methods
     */
    this.extension = Object.create(parentShadoPrototype?.extension ?? null);

    if (/* __DEV__ && */ this.parentShadoPrototype) {
      let obj: any = this.targetPrototype;
      let proto = this.parentShadoPrototype.targetPrototype;
      let matched = false;
      while (obj && !matched) {
        matched = obj === proto;
        obj = Object.getPrototypeOf(obj);
      }
      assert(matched, `Invalid prototype chain`)
    }
  }

  private callOnBeforeInterceptObject(obj: ObjectType): void {
    this.parentShadoPrototype?.callOnBeforeInterceptObject(obj as unknown as ParentType);
    this.onBeforInterceptObj?.call(obj);
  }

  private callOnAfterInterceptObject(obj: ObjectType): void {
    this.parentShadoPrototype?.callOnAfterInterceptObject(obj as unknown as ParentType);
    this.onAfterInterceptObj?.call(obj);
  }

  protected interceptObjectItself(obj: ObjectType): void {
    this.parentShadoPrototype?.interceptObjectItself(obj as unknown as ParentType);
    // We can make any necessary modificatio to the object itself here
    if (this.pendingPropertyInterceptors) {
      for (const pi of this.pendingPropertyInterceptors) {
        pi.interceptObjectOwnProperties(obj);
      }
    }
  }


  public interceptObject(obj: ObjectType) {
    // This behaves similar to how constructors work, i.e. from parent class to child class
    this.callOnBeforeInterceptObject(obj);
    this.interceptObjectItself(obj);
    this.callOnAfterInterceptObject(obj);
  }

  public addPendingPropertyInterceptor(pi: PropertyInterceptor) {
    if (!this.pendingPropertyInterceptors) {
      this.pendingPropertyInterceptors = [];
    }
    this.pendingPropertyInterceptors.push(pi);
  }
}
