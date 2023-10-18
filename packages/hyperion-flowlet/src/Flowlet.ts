/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";

export const onFlowletInit = new Hook<<T extends {} = {}>(flowlet: Flowlet<T>) => void>();

let flowletID: number = 0;

export interface FlowletDataType {
  triggerFlowlet?: Flowlet;
}

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
      this._fullName = `${this.parent?.getFullName() ?? ""}/${this.name}`;
    }
    return this._fullName;
  }

  fork(name: string): Flowlet<T> {
    return new Flowlet<T>(name, this);
  }

  toString(): string {
    return this.getFullName();
  }
}
