export const EmptyCallback: Function = () => { };

export class Hook<CallbackType extends Function> {
  private _callbacks?: CallbackType[];
  public call = <CallbackType>EmptyCallback;

  protected createMultiCallbackCall(callbacks: CallbackType[]): CallbackType {
    const call = function (this: unknown): void {
      const currentCallbacks = callbacks; // We could also use this._callbacks
      for (const cb of currentCallbacks) {
        cb.apply(this, arguments);
      }
    }
    return <CallbackType>(<Function>call);
  }

  public add(cb: CallbackType): CallbackType {
    if (this.call === EmptyCallback) {
      this.call = cb;
    } else if (!this._callbacks) {
      this._callbacks = [this.call, cb];
      this.call = this.createMultiCallbackCall(this._callbacks);
    } else {
      this._callbacks.push(cb);
    }
    return cb;
  }
}