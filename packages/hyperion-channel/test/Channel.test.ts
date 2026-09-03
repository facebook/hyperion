/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import {
  Channel,
  PausableChannel,
  type IEmitter,
} from "../src/Channel";

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

  test("unpipe channels", () => {
    const channel1 = new Channel<ChannelEvents>();
    const channel2 = new Channel<ChannelEvents>();
    const channel3 = new Channel<ChannelEvents>();

    const fn1 = jest.fn<void, ChannelEvents['ev1']>();
    const fn2 = jest.fn<void, ChannelEvents['ev1']>();

    channel2.addListener('ev1', fn1);
    channel3.addListener('ev1', fn2);

    channel1.pipe(channel2);
    channel1.pipe(channel3, task => task());
    channel1.emit('ev1');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);

    channel1.unpipe(channel2);
    channel1.emit('ev1');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);

    channel1.unpipe(channel2);
    channel1.unpipe(channel3);
    channel1.emit('ev1');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
  });

  test("safe emission isolates listeners and downstream channels", () => {
    const channel1 = new Channel<ChannelEvents>();
    const channel2 = new Channel<ChannelEvents>();
    const calls: string[] = [];
    channel1.addListener('ev1', () => {
      calls.push('first');
      throw new Error('listener failure');
    });
    channel1.addListener('ev1', () => calls.push('second'));
    channel2.addListener('ev1', () => {
      calls.push('downstream first');
      throw new Error('downstream failure');
    });
    channel2.addListener('ev1', () => calls.push('downstream second'));
    channel1.pipe(channel2);

    expect(() => channel1.emitSafely('ev1')).not.toThrow();
    expect(calls).toEqual([
      'first',
      'second',
      'downstream first',
      'downstream second',
    ]);
  });

  test("safe emission supports legacy downstream emitters", () => {
    const channel = new Channel<Pick<ChannelEvents, 'ev2'>>();
    const downstream: IEmitter<Pick<ChannelEvents, 'ev2'>> = {
      emit: jest.fn<void, [eventType: 'ev2', value: number]>(),
    };
    channel.pipe(downstream);

    channel.emitSafely('ev2', 42);

    expect(downstream.emit).toHaveBeenCalledWith('ev2', 42);
  });

  test("safe emission snapshots listeners removed during dispatch", () => {
    const channel = new Channel<ChannelEvents>();
    const calls: string[] = [];
    const removed = () => calls.push('removed');
    channel.addListener('ev1', () => {
      calls.push('first');
      channel.removeListener('ev1', removed);
    });
    channel.addListener('ev1', removed);

    channel.emitSafely('ev1');
    expect(calls).toEqual(['first', 'removed']);
  });

  test("pausable channels suppress safe emission", () => {
    const channel = new PausableChannel<ChannelEvents>();
    const listener = jest.fn<void, []>();
    channel.addListener('ev1', listener);
    channel.pause();
    channel.emitSafely('ev1');
    expect(listener).not.toHaveBeenCalled();
    channel.unpause();
    channel.emitSafely('ev1');
    expect(listener).toHaveBeenCalledTimes(1);
  });

});
