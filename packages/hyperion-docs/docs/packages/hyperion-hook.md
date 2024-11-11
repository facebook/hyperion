---
sidebar_position: 1
---

[Hyperion-Hook](https://github.com/facebook/hyperion/tree/main/packages/hyperion-hook) is one of the fundumental concepts in hyperion.
It provide a very fast and JIT friendly mechanism to maintain
a list of functions to be called sequenctially.

This mechansim can be used to implement callbacks, transformers, ...

All interceptors in [hyperion-core](./hyperion-core/intro.md) rely on the `Hook`

The `Hook` class has a type parameter that determines the type of
the function it represents.
```TypeScript
import { Hook } from "@hyperion/hyperion-hook";

const h1 = new Hook<(i: number)=>void>();
h1.add(()=> console.log('Called'));
h1.add(i => console.log('with argument', i));
h1.call(42);
```

When a `Hook` has 0 or 1 callbacks, it is easy to understand
what it does. However, for more than 1 callback, we might need
to create special logic. This is specially true if the function
return a value and act as serries of transformers.

The `Hook` as a `protected createMultiCallbackCall` method that
you can overload and add your own special behavior.

```TypeScript
import { Hook } from "@hyperion/hyperion-hook";

type CallbackType = (i: number)=> number;
class MyHook extends Hook<CallbackType>{
   protected createMultiCallbackCall(callbacks: CallbackType[][): CallbackType {
    return function (this, args) {
      let result = args;
      for (let i = 0, len = callbacks.length; i < len; ++i) {
        result = callbacks[i].call(this, result);
      }
      return result;
    }
  }
}

const h1 = new MyHook();
h1.add(i => i + 1);
h1.add(i => i * 2);
const result = h1.call(20);
console.log(result); // (20 + 1) * 2 = 42
```

## Hook vs Event
Hook enables message bassing mechanism for event driven system. However, we call it a hook and not an event because:
* Usually events are asynchrounous, but hooks are synchroneously called
* Hook can reutnr a value and impact the execution of the system, while events by definition are now supposed to have impact on the
normal flow of execution

This distinction is [commonly accepted](https://softwareengineering.stackexchange.com/questions/237876/what-should-plugins-use-hooks-events-or-something-else) in other frameworks as well. 