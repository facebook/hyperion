---
sidebar_position: 2
---

# Function Interceptor
[`FunctionInterceptor<FuncType>`](https://github.com/facebook/hyperion/blob/main/packages/hyperion-core/src/FunctionInterceptor.ts) is at the heart of [hyperion-core](./intro.md) and creates
a high performance wrapper around a given function and provides following important functionality:
* observers that can observe function arguments or function return value
* mappers that allow callbacks to modify arguments of the function before it is called, or return value of the function after it is called.
* mechanism to prevent execution of the function

The type argument of the `FunctionInterceptor<FuncType>` determines the signature of the
function that is intercepted. The signature of callbacks for the following api is computed
based on this given type argument and hence all api provide a fully typed experience.

The following are main API of this class:


## argument observers and mappers 

The `onBeforeCallObserverAdd(callback)` method allows installing argument observer.
The callback will be called before the original function is called. This callback
can observe the value of the arguments, but cannot change them. The signature of this callback
will be exactly the same as the original function, but it can return a `boolean` value.
If any such callback returns `true`, then the original function won't be called; which is useful to implement security features or provide alternative implementations for the function.

The `onBeforeCallMapperAdd(callback)` method allows installing an argument mapper.
The callback will be called before the original function is called. This callback
recieves an array (similar to JavaScript `arguments` object) and can modify and return
a new argument array with new values of the arguments.
This callback is more expensive than the observer variant and should be used with care.

If multiple mappers are installed, the output of each callback is passed to the next one as input.

See [FunctionInterceptor.test.ts](https://github.com/facebook/hyperion/blob/main/packages/hyperion-core/test/FunctionInterceptor.test.ts) for example code.


## return value observers and mappers

The `onAfterCallObserverAdd(callback)` method allows installing return value observer.
The callback recieves a value of the type of the original function return value and return void. This function is called original function is called. 

The `onAfterCallMapperAdd(callback)` also allows the callback to change the return value of the function to something of **the same type**.

If multiple mappers are installed, the output of each callback is passed to the next one as input.

See [FunctionInterceptor.test.ts](https://github.com/facebook/hyperion/blob/main/packages/hyperion-core/test/FunctionInterceptor.test.ts) for example code.


## argument + return value mapper

Sometimes we might need to know the input arguments to make a modification to the return value.
Or we might need to create intermediary values based on input argument before the function call
and then use that value after the function call to process the output. 
We might even simply want to run to pieces of related code before and after a function (e.g. start time and end time of a function to measure its latency)

To make such cases easier, the `onBeforeAndAfterCallMapperAdd(callback)` method allows
a callback to receive arguments of the function in an array (which it can update) and return
a function that will be used to observe or map the return value of the function. 

Note that this function is the most expensive form of interception and should be used only
when really necessary.

See [FunctionInterceptor.test.ts](https://github.com/facebook/hyperion/blob/main/packages/hyperion-core/test/FunctionInterceptor.test.ts) for example code.


## extra data on the interceptor object

The `FunctionInterceptor` class creates an interceptor object which can also carry 
extra data. the `setData<T>(dataPropName: string, value: T): void` and `getData<T>(dataPropName: string): T | undefined` methods allow named properties to be added to this object. 

A very common usecase to track if certain type of callback is added to an interceptor. While one can implement such functionality using combination of `getData` and `setData`, the helper `testAndSet(dataPropName: string): boolean` method provide this functionality out of the box.



All of the above methods have a corresponding `...Remove` counterpart that allow removing
a callback at any time. This is particularly useful at runtime if an observer has found the
situation it was looking for and can remove the callback to reduce the performace overhead it adds.

## Builtin JS interceptors

The `hyperion-core` package already contains ready main interceptors for the following JS objects
* IGlobalThis provides interceptors for global methods such as (setTimeout, setInterval)
* IPromise provies interceptos for all `Promise` methods and constructors
* IRequre provide interceptors for typical implementations of js `require` funcationality which can be used to investigate modules and bootstrap further interception of their output.