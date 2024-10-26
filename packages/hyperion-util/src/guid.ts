
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export type GUID = string;

const getRandomIntString = (() => {
  /**
   * If possible we use the cryto api to give us better random
   * values, and also avoid the conversion of random value to integer
   */
  if (typeof globalThis === "object" && globalThis.crypto) {
    class EntropyPool {
      #entropy: Uint32Array;
      #index: number;
      constructor(poolSize = 1024) {
        this.#entropy = new Uint32Array(poolSize);
        this.#index = 0;
        crypto.getRandomValues(this.#entropy);
      }
      next() {
        const value = this.#entropy[this.#index++];
        if (this.#index === this.#entropy.length) {
          crypto.getRandomValues(this.#entropy);
          this.#index = 0;
        }
        return value;
      }
    }

    const pool = new EntropyPool(50);

    return () => pool.next().toString(16);
  } else {
    return () => (Math.random() * (1 << 30)).toString(16).replace('.', '');
  }
})()

export function guid(): GUID {
  return 'f' + getRandomIntString();
}
