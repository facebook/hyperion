/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export const EmptyCallback: Function = () => { };

type Extended<CallbackType> = CallbackType & {
  _original?: CallbackType,
};

export class Hook<CallbackType extends Function> {
  private _callbacks?: CallbackType[];
  public call = <CallbackType>EmptyCallback;


  hasCallback(cb?: CallbackType): boolean {
    if (!this._callbacks) {
      return cb ? this.call === cb : this.call !== EmptyCallback;
    } else {
      const callbacks = <Extended<CallbackType>[]>this._callbacks;
      return (
        callbacks.length > 0 &&
        (
          !cb ||
          callbacks.some(func => func === cb || func._original === cb)
        )
      );
    }
  }

  protected createMultiCallbackCall(callbacks: CallbackType[]): CallbackType {
    const call = function (this: unknown): void {
      const currentCallbacks = callbacks; // We could also use this._callbacks
      for (let i = 0, len = currentCallbacks.length; i < len; ++i) {
        currentCallbacks[i].apply(this, arguments);
      }
    }
    return <CallbackType>(<Function>call);
  }

  public add(cb: CallbackType, once?: boolean): CallbackType {
    let callback = cb;
    if (once) {
      const that = this;
      const tmp = <Extended<CallbackType>><unknown>function (this: unknown) {
        that.remove(tmp);
        return cb.apply(this, arguments);
      };
      tmp._original = cb;
      callback = tmp;
    }

    if (this.call === EmptyCallback) {
      this.call = callback;
    } else if (!this._callbacks) {
      this._callbacks = [this.call, callback];
      this.call = this.createMultiCallbackCall(this._callbacks);
    } else {
      this._callbacks.push(callback);
    }
    return cb;
  }

  public remove(cb: CallbackType): boolean {
    return this.removeIf(f => f === cb);
  }

  public removeIf(condition: (cb: CallbackType) => boolean): boolean {
    /**
     * Two cases to consider:
     * - remove may be called while a .call is going on, we should make sure
     *   changing the _callbacks list while running them will not break the
     *   ongoing .call, otherwise the index gets messed up.
     * - a listener may have been added multiple times (although a bad practice)
     * So, we make a new copy of the _callbacks list
     * Since remove is called less often, it is ok to make this function more
     * expensive than .call (e.g. detecting when a .call is running)
     */
    if (this._callbacks) {
      const newList = this._callbacks.filter(l => !condition(l));
      // Alternatively we can find the index of cb and just replace it with EmptyCallback

      /**
       * We must have changed .call to close on this._callbacks before, we update the .call
       * now, and if we are in the middle of a .call already, it is safe, and we'll correct
       * it next time.
       */
      const changed = this._callbacks.length > newList.length;
      if (changed) {
        this._callbacks = newList;
        this.call = this.createMultiCallbackCall(this._callbacks);
      }
      return changed;
    } else if (condition(this.call)) {
      this.call = <CallbackType>EmptyCallback;
      return true;
    } else {
      return false;
    }
  }

  public clear() {
    if (this.call === EmptyCallback || !this._callbacks) {
      this.call = <CallbackType>EmptyCallback;
    } else {
      this._callbacks.length = 0;
    }
  }
}