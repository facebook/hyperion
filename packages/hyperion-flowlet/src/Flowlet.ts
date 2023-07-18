/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";

export const onFlowletInit = new Hook<(flowlet: Flowlet) => void>();

let flowletID: number = 0;

export class Flowlet<T extends {} = {}> {
  readonly data: T;
  private _id: number = flowletID++;
  private _fullName: string | null = null;

  constructor(
    public readonly name: string,
    public readonly parent?: Flowlet<T> | null
  ) {
    this.data = Object.create(parent?.data ?? null);
    onFlowletInit.call(this);
  }

  getFullName(): string {
    if (!this._fullName) {
      this._fullName = `${this.parent?.getFullName() ?? ""}/${this.name}`;
    }
    return this._fullName;
  }

  getID(): number {
    return this._id;
  }

  fork(name: string): Flowlet<T> {
    return new Flowlet<T>(name, this);
  }
}
