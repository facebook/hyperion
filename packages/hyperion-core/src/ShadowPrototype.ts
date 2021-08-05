import { Hook } from "@hyperion/hook";

type Extension = {
};


export class ShadowPrototype<ObjectType extends Object = any, ParentType extends Object = any> {
  readonly extension: Extension;
  readonly onBeforInterceptObj = new Hook<(obj: ObjectType) => void>();
  readonly onAfterInterceptObj = new Hook<(obj: ObjectType) => void>();

  constructor(private readonly parentShadoPrototype: ShadowPrototype<ParentType> | null) {
    /**
     * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
     * in the following methods
     */
    this.extension = Object.create(parentShadoPrototype?.extension ?? null);
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
  }


  public interceptObject(obj: ObjectType) {
    // This behaves similar to how constructors work, i.e. from parent class to child class
    this.callOnBeforeInterceptObject(obj);
    this.interceptObjectItself(obj);
    this.callOnAfterInterceptObject(obj);
  }
}
