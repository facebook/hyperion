/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

export class Flowlet {
  constructor(
    public readonly name: string,
    public readonly parent?: Flowlet
  ) {
  }

  fullName(): string {
    return `${this.parent?.fullName() ?? ""}/${this.name}`;
  }

  fork(name: string): Flowlet {
    return new Flowlet(name, this);
  }
}