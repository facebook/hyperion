/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import "./reference";
import { assert } from "@hyperion/hyperion-global";
import { Hook } from "@hyperion/hyperion-hook";

export const onFlowletInit = new Hook<<T extends {} = {}>(flowlet: Flowlet<T>) => void>();

let flowletID: number = 0;

export interface FlowletDataType {
  triggerFlowlet?: Flowlet;
}

const MAX_CHAIN_LENGTH = 1000;

export class Flowlet<T extends FlowletDataType = FlowletDataType> {
  readonly data: T;
  readonly id: number = flowletID++;
  private _fullName: string | null = null;

  constructor(
    public readonly name: string,
    public readonly parent?: Flowlet<T> | null
  ) {
    this.data = Object.create(parent?.data ?? null);
    onFlowletInit.call<T>(this);
  }

  getFullName(): string {
    if (!this._fullName) {
      // The following is easiest approach, but does not work for very long chains!
      // this._fullName = `${this.parent?.getFullName() ?? ""}/${this.name}`;
      const rawFlowlets : Flowlet<T>[] = [this];
      let i=0;
      let f: Flowlet<T> | null | undefined =this.parent;
      while (f && !f._fullName && i < MAX_CHAIN_LENGTH) {
        rawFlowlets.push(f);
        ++i;
        f = f.parent;
      }
      if (__DEV__){
        assert(f == null || f._fullName != null || i>= MAX_CHAIN_LENGTH, 'invalid situation');
      }
      let prefix: string = f ? (f._fullName ?? '...') : '';
      for (let j = rawFlowlets.length-1; j>=0; --j){
        let flowlet = rawFlowlets[j];
        flowlet._fullName = prefix = prefix + "/" + flowlet.name + ":" + flowlet.id;
      }
    }
    if (__DEV__){
      assert(!!this._fullName, 'By now ._fullName should have been assigned');
    }
    return this._fullName!;
  }

  fork(name: string): Flowlet<T> {
    return new Flowlet<T>(name, this);
  }

  toString(): string {
    return this.getFullName();
  }
}
