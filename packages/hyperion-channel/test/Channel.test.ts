/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { Channel, PausableChannel } from "../src/Channel";

type ChannelEvents = {
  ev1: [],
  ev2: [i: number],
  ev3: [i: number, s: string]
}

describe("test Channel", () => {
  test("empty callback", () => {
    const channel = new Channel<Pick<ChannelEvents, 'ev1'>>();
    expect(channel.emit('ev1')).toBe(undefined);
  });

  test("simple callback", () => {
    const channel = new Channel<ChannelEvents>();
    const fn1 = jest.fn((i: number) => { });
    const fn2 = jest.fn<void, ChannelEvents['ev1']>();

    channel.on('ev2').add(fn1);
    channel.on('ev1').add(fn2);

    channel.emit('ev2', 20);
    expect(fn2).toBeCalledTimes(0);
    expect(fn1).toBeCalledTimes(1);
    expect(fn1.mock.calls[0]).toEqual([20]);
  });

  test("multiple callbacks", () => {
    const channel = new Channel<ChannelEvents>();
    const fn1 = jest.fn<void, ChannelEvents['ev3']>();
    const fn2 = jest.fn<void, ChannelEvents['ev3']>();

    channel.on('ev3').add(fn1);
    channel.on('ev3').add(fn2);

    channel.emit('ev3', 20, "hi");

    expect(fn1).toBeCalledTimes(1);
    expect(fn1.mock.calls[0]).toEqual([20, "hi"]);

    expect(fn2).toBeCalledTimes(1);
    expect(fn2.mock.calls[0]).toEqual([20, "hi"]);
  });

  test("multiple callbacks - simpler api", () => {
    const channel = new Channel<ChannelEvents>();
    const fn1 = jest.fn<void, ChannelEvents['ev3']>();
    const fn2 = jest.fn<void, ChannelEvents['ev3']>();

    channel.addListener('ev3', fn1);
    channel.addListener('ev3', fn2);

    channel.emit('ev3', 20, "hi");

    expect(fn1).toBeCalledTimes(1);
    expect(fn1.mock.calls[0]).toEqual([20, "hi"]);

    expect(fn2).toBeCalledTimes(1);
    expect(fn2.mock.calls[0]).toEqual([20, "hi"]);
  });

  test("piped channels", (done) => {
    const channel1 = new Channel<ChannelEvents>();
    const channel2 = new Channel<ChannelEvents>();
    const channel3 = new Channel<ChannelEvents>();
    const fn1 = jest.fn<void, ChannelEvents['ev3']>();
    const fn2 = jest.fn<void, ChannelEvents['ev3']>();

    channel1
      .pipe(channel2, task => {
        Promise.resolve().then(task); // waits one tick before passing to the next channel
      })
      .pipe(channel3);

    channel2.addListener('ev3', fn1);
    channel2.addListener('ev3', fn2);

    channel3.addListener('ev1', () => {
      expect(fn1).toBeCalledTimes(1);
      expect(fn1.mock.calls[0]).toEqual([20, "hi"]);

      expect(fn2).toBeCalledTimes(1);
      expect(fn2.mock.calls[0]).toEqual([20, "hi"]);
      done();
    });

    channel1.emit('ev3', 20, "hi");
    channel1.emit('ev1');

  });

  test("piped channels w/ transformation", () => {
    const channel1 = new Channel<ChannelEvents>();
    const channel2 = new Channel<ChannelEvents>();
    const fn1 = jest.fn<void, ChannelEvents['ev3']>();
    const fn2 = jest.fn<void, ChannelEvents['ev3']>();

    // This example shows how to add a channel in the middle for transforming values
    channel1
      .pipe(new class extends Channel<ChannelEvents> {
        constructor() {
          super();
          this.addListener('ev3', (i, s) => {
            channel2.emit('ev3', i * 2, s);
          });
        }
      });

    channel2.addListener('ev3', fn1);
    channel2.addListener('ev3', fn2);


    channel1.emit('ev3', 20, "hi");

    expect(fn1).toBeCalledTimes(1);
    expect(fn1.mock.calls[0]).toEqual([40, "hi"]);

    expect(fn2).toBeCalledTimes(1);
    expect(fn2.mock.calls[0]).toEqual([40, "hi"]);

  });

  test("piped multi-channels", (done) => {
    type ChannelEventsExt = ChannelEvents & {
      /**
       * Note that the following line overwrites the type of ev2 from ChannelEvents.
       * This is bad and should be avoided. The best I could do for now to detect
       * this and cause the return of the .pipe to be `never`.
       * You can see the effect by commenting the following line and then see the
       * return type of the `channel1.pipe(channel3)` to change from 'never' to `typeof channel3`
       */
      ev2: [i: boolean],
      ev4: [i: string, s: string];
    }

    const channel1 = new Channel<ChannelEvents>();
    const channel2 = new Channel<ChannelEvents>();
    const channel3 = new Channel<ChannelEventsExt>();
    const fn1 = jest.fn<void, ChannelEvents['ev3']>();
    const fn2 = jest.fn<void, ChannelEvents['ev3']>();

    channel1.pipe(channel2, task => {
      Promise.resolve().then(task); // waits one tick before passing to the next channel
    });
    function test<T extends typeof channel3>(i: T) { return i.addListener; };
    test(channel1.pipe(channel3));

    channel2.addListener('ev3', fn1);
    channel3.addListener('ev3', fn2);

    channel2.addListener('ev1', () => {
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn1.mock.calls[0]).toEqual([20, "hi"]);
      done();
    });
    channel3.addListener('ev1', () => {
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn2.mock.calls[0]).toEqual([20, "hi"]);
    });

    channel1.emit('ev3', 20, "hi");
    channel3.emit('ev4', 'hello', 'world');
    channel1.emit('ev1');

  });

  test("multi to one piped channels", () => {

    const channel1 = new Channel<ChannelEvents>();
    const channel2 = new Channel<ChannelEvents>();
    const channel3 = new Channel<ChannelEvents>();
    const fn1 = jest.fn<void, ChannelEvents['ev1']>();
    const fn2 = jest.fn<void, ChannelEvents['ev1']>();

    channel1.pipe(channel3);
    channel2.pipe(channel3);

    channel2.addListener('ev1', fn1);
    channel3.addListener('ev1', fn2);

    channel1.emit('ev1');
    expect(fn1).toHaveBeenCalledTimes(0);
    expect(fn2).toHaveBeenCalledTimes(1);

    channel2.emit('ev1');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
  });

  test("pausable channels", () => {
    const channel1 = new PausableChannel<ChannelEvents>();
    const fn1 = jest.fn<void, ChannelEvents['ev1']>();

    channel1.addListener('ev1', fn1);

    channel1.emit('ev1');
    channel1.emit('ev1');
    expect(fn1).toHaveBeenCalledTimes(2);

    channel1.pause();
    channel1.emit('ev1');
    channel1.emit('ev1');
    expect(fn1).toHaveBeenCalledTimes(2);

    channel1.unpause();
    channel1.emit('ev1');
    channel1.emit('ev1');
    expect(fn1).toHaveBeenCalledTimes(4);
  });


});
