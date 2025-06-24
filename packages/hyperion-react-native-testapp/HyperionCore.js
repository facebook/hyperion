/**
 * @format
 */

import { assert } from '../hyperion-globals';
import globalScope from '../hyperion-globals/src/global';
import { Hook } from '../hyperion-hook';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
class PropertyInterceptor {
    name;
    status = 0 /* InterceptionStatus.Unknown */;
    constructor(name) {
        this.name = name;
        __DEV__ && assert(!!this.name, "Interceptor name should have value");
    }
    interceptObjectOwnProperties(_obj) {
        __DEV__ && assert(false, `This method must be overriden`);
    }
}
/**
  * Searches the object or its prototype chain for a given property name
  * and the actual object that has the property is stores in the .container
  * field.
  */
function getExtendedPropertyDescriptor(obj, propName) {
    let desc;
    while (obj && !desc) {
        desc = Object.getOwnPropertyDescriptor(obj, propName);
        if (desc) {
            desc.container = obj;
        }
        obj = Object.getPrototypeOf(obj);
    }
    return desc;
}
function defineProperty(obj, propName, desc) {
    __DEV__ && assert(!!desc, "invalid proper description");
    try {
        Object.defineProperty(obj, propName, desc);
    }
    catch (e) {
        __DEV__ && console.warn(propName, " defining throws exception : ", e, " on ", obj);
    }
}
const ObjectHasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, propName) {
    return ObjectHasOwnProperty.call(obj, propName);
}
function copyOwnProperties(src, dest, copySpecials) {
    if (!src || !dest) {
        // Not much to copy. This can legitimately happen if for example function/attribute value is undefined during interception.
        return;
    }
    __DEV__ && assert((typeof dest === "function" && typeof src === "function") || (typeof dest === "object" && typeof src === "object"), "Can only copy own properties of functions and objects");
    const ownProps = Object.getOwnPropertyNames(src);
    for (let i = 0, length = ownProps.length; i < length; ++i) {
        const propName = ownProps[i];
        if (!(propName in dest)) {
            const desc = Object.getOwnPropertyDescriptor(src, propName); //Since we are iterating the getOwnPropertyNames, we know this must have value
            assert(desc != null, `Unexpected situation, we should have own property for ${propName}`);
            try {
                Object.defineProperty(dest, propName, desc);
            }
            catch (e) {
                __DEV__ && console.error("Adding property ", propName, " throws exception: ", e);
            }
        }
    }
    {
        dest.toString = function () {
            return src.toString();
        };
        if (src.hasOwnProperty('valueOf')) {
            dest.valueOf = function () {
                return src.valueOf();
            };
        }
        dest.prototype = src.prototype;
        const nameDesc = Object.getOwnPropertyDescriptor(src, 'name');
        try {
            Object.defineProperty(dest, 'name', nameDesc);
        }
        catch (e) {
            __DEV__ && console.error("Adding property name threw exception: ", e);
        }
    }
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
const ExtensionPropName = "__ext";
const ShadowPrototypePropName = "__sproto";
let extensionId = 0;
const shadowPrototypeGetters = [];
/**
 * @param getter function to map a given object to a shadow prototype
 * @returns a function that can remove the getter.
 */
function registerShadowPrototypeGetter(getter) {
    shadowPrototypeGetters.push(getter);
    return (() => {
        const index = shadowPrototypeGetters.indexOf(getter);
        if (index > -1) {
            shadowPrototypeGetters.splice(index, 1);
        }
    });
}
function getOwnShadowPrototypeOf(protoObj) {
    const shadowProto = Object.getOwnPropertyDescriptor(protoObj, ShadowPrototypePropName);
    return shadowProto?.value;
}
/**
 * intercept function can look up the prototype chain to find a proper ShadowPrototype for intercepting
 * a given object.
 * You should be careful to call this function on non-leaf nodes of the prototype chain.
 * This will be the last priority after the shadowPrototypeGetters is tried
 */
function registerShadowPrototype(protoObj, shadowPrototype) {
    __DEV__ && assert(!protoObj[ShadowPrototypePropName], `hiding existing ShadowPrototype in the chain of prototype ${protoObj}.`, { logger: { error: msg => console.debug(msg) } });
    Object.defineProperty(protoObj, ShadowPrototypePropName, {
        value: shadowPrototype,
        // configurable: true,
    });
    return shadowPrototype;
}
let cachedPropertyDescriptor = {
/** Want all the following fields to be false, but should not specify explicitly
 * enumerable: false,
 * writable: false,
 * configurable: false
 */
};
function isInterceptable(value) {
    /**
     * Generally we want to intercept objects and functions
     * Html tags are generally object, but some browsers use function for tags such as <object>, <embed>, ...
     */
    let typeofValue = typeof value;
    return value &&
        (typeofValue === "object" || typeofValue === "function");
}
export function isIntercepted(value) {
    return hasOwnProperty(value, ExtensionPropName);
}
function intercept(value, shadowPrototype) {
    if (isInterceptable(value) && !isIntercepted(value)) {
        __DEV__ && assert(!!shadowPrototype || !value[ExtensionPropName], "Unexpected situation");
        // TODO: check for custom interceptors
        let shadowProto = shadowPrototype;
        for (let i = 0; !shadowProto && i < shadowPrototypeGetters.length; ++i) {
            shadowProto = shadowPrototypeGetters[i](value);
        }
        if (!shadowProto) {
            shadowProto = value[ShadowPrototypePropName];
        }
        if (shadowProto) {
            let extension = {
                virtualPropertyValues: {},
                shadowPrototype: shadowProto,
                id: extensionId++,
            };
            cachedPropertyDescriptor.value = extension;
            Object.defineProperty(value, ExtensionPropName, cachedPropertyDescriptor); // has to be done before interception starts
            shadowProto.interceptObject(value);
        }
    }
    return value;
}
function getObjectExtension(obj, interceptIfAbsent) {
    __DEV__ && assert(isInterceptable(obj), "Only objects or functions are allowed");
    let ext = obj[ExtensionPropName];
    if (!ext && interceptIfAbsent) {
        intercept(obj);
        ext = obj[ExtensionPropName];
    }
    return ext;
}
function getVirtualPropertyValue(obj, propName) {
    const ext = getObjectExtension(obj, true);
    return ext?.virtualPropertyValues[propName];
}
function setVirtualPropertyValue(obj, propName, value) {
    const ext = getObjectExtension(obj, true);
    if (ext) {
        ext.virtualPropertyValues[propName] = value;
    }
    else {
        assert(!!ext, `Could not get extension for the object`);
    }
    return value;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
const FuncExtensionPropName = "__ext";
const unknownFunc = function () {
    console.warn('Unknown or missing function called! ');
};
class OnBeforeCallMapper extends Hook {
    createMultiCallbackCall(callbacks) {
        return function (args) {
            let result = args;
            for (let i = 0, len = callbacks.length; i < len; ++i) {
                result = callbacks[i].call(this, result);
            }
            return result;
        };
    }
}
class OnBeforeCallObserver extends Hook {
    createMultiCallbackCall(callbacks) {
        return function () {
            let skipApi = false;
            for (let i = 0, len = callbacks.length; i < len; ++i) {
                const cb = callbacks[i];
                /**
                 * If any of the callbacks return true (truthy), then we should skip
                 * calling the original function.
                 * However, we want to ensure we call of the callbacks and hence should
                 * avoid short circuting the loop.
                 */
                skipApi = cb.apply(this, arguments) || skipApi;
            }
            return skipApi;
        };
    }
}
class OnAfterCallMapper extends Hook {
    createMultiCallbackCall(callbacks) {
        return function (value) {
            let result = value;
            for (let i = 0, len = callbacks.length; i < len; ++i) {
                result = callbacks[i].call(this, result);
            }
            return result;
        };
    }
}
class OnAfterCallObserver extends Hook {
}
class OnBeforeAndAfterCallMapper extends Hook {
    createMultiCallbackCall(callbacks) {
        return function () {
            const onValueMappers = [];
            for (let i = 0, len = callbacks.length; i < len; ++i) {
                const cb = callbacks[i];
                onValueMappers.push(cb.apply(this, arguments));
            }
            return (function (value) {
                let result = value;
                for (let i = 0, len = onValueMappers.length; i < len; ++i) {
                    const cb = onValueMappers[i];
                    result = cb.call(this, result);
                }
                return result;
            });
        };
    }
}
class FunctionInterceptor extends PropertyInterceptor {
    onBeforeCallMapper;
    onBeforeCallObserver;
    onAfterCallMapper;
    onAfterCallObserver;
    onBeforeAndAterCallMapper;
    original = unknownFunc;
    customFunc;
    implementation; // usually either the .original or the .customFunc
    interceptor;
    dispatcherFunc;
    /**
     * The following allows the users of this class add additional information to the instances.
     * One common usecase is checking if certain aspect is added via various callback mechanisms.
     */
    data;
    constructor(name, originalFunc = unknownFunc, interceptOutput = false) {
        super(name);
        const that = this;
        // In all cases we are dealing with methods, we handle constructors separately.
        // It is too cumbersome (and perf inefficient) to separate classes for methods and constructors.
        // TODO: is there a runtime check we can do to ensure this? e.g. checking func.prototype? Some constructors are functions too!
        this.interceptor = !interceptOutput
            ? function () {
                const result = (that.dispatcherFunc).apply(this, arguments);
                return result;
            }
            : function () {
                const result = (that.dispatcherFunc).apply(this, arguments);
                return intercept(result);
            };
        setFunctionInterceptor(this.interceptor, this);
        this.implementation = originalFunc;
        this.dispatcherFunc = this.original; // By default just pass on to original
        this.setOriginal(originalFunc); // to perform any extra bookkeeping
    }
    getOriginal() {
        return this.original;
    }
    setOriginal(originalFunc) {
        if (this.original === originalFunc) {
            return; // not much left to do
        }
        this.original = originalFunc;
        if (!this.customFunc) {
            // If no custom function is set, the implementation should point to original function
            this.implementation = originalFunc;
        }
        /**
         * We should make interceptor look as much like the original as possible.
         * This includes {.name, .prototype, .toString(), ...}
         * Note that copyOwnProperties will skip properties that destination already has
         * therefore we might have to copy some properties manually
         */
        copyOwnProperties(originalFunc, this.interceptor);
        setFunctionInterceptor(originalFunc, this);
        this.updateDispatcherFunc();
    }
    setCustom(customFunc) {
        // Once we have custom implementation, we chose that from that point on
        __DEV__ && assert(!this.customFunc, `There is already a custom function assigned to ${this.name}`);
        this.customFunc = customFunc;
        this.implementation = customFunc;
        this.updateDispatcherFunc();
    }
    static dispatcherCtors = (() => {
        // type T = { "foo": InterceptableFunction };
        // const ctors: { [index: number]: (fi: FunctionInterceptor<"foo", T>) => Function } = {
        const ctors = {
            [0 /* InterceptorState.Has_________________ */]: fi => fi.customFunc ?? fi.original,
            [1 /* InterceptorState.Has_______________VO */]: fi => function () {
                let result;
                result = fi.implementation.apply(this, arguments);
                fi.onAfterCallObserver.call.call(this, result);
                return result;
            },
            [2 /* InterceptorState.Has____________VM___ */]: fi => function () {
                let result;
                result = fi.implementation.apply(this, arguments);
                result = fi.onAfterCallMapper.call.call(this, result);
                return result;
            },
            [3 /* InterceptorState.Has____________VM_VO */]: fi => function () {
                let result;
                result = fi.implementation.apply(this, arguments);
                result = fi.onAfterCallMapper.call.call(this, result);
                fi.onAfterCallObserver.call.call(this, result);
                return result;
            },
            [4 /* InterceptorState.Has________AO_______ */]: fi => function () {
                let result;
                if (!fi.onBeforeCallObserver.call.apply(this, arguments)) {
                    result = fi.implementation.apply(this, arguments);
                }
                return result;
            },
            [5 /* InterceptorState.Has________AO_____VO */]: fi => function () {
                let result;
                if (!fi.onBeforeCallObserver.call.apply(this, arguments)) {
                    result = fi.implementation.apply(this, arguments);
                    fi.onAfterCallObserver.call.call(this, result);
                }
                return result;
            },
            [6 /* InterceptorState.Has________AO__VM___ */]: fi => function () {
                let result;
                if (!fi.onBeforeCallObserver.call.apply(this, arguments)) {
                    result = fi.implementation.apply(this, arguments);
                    result = fi.onAfterCallMapper.call.call(this, result);
                }
                return result;
            },
            [7 /* InterceptorState.Has________AO__VM_VO */]: fi => function () {
                let result;
                if (!fi.onBeforeCallObserver.call.apply(this, arguments)) {
                    result = fi.implementation.apply(this, arguments);
                    result = fi.onAfterCallMapper.call.call(this, result);
                    fi.onAfterCallObserver.call.call(this, result);
                }
                return result;
            },
            [8 /* InterceptorState.Has_____AM__________ */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                result = fi.implementation.apply(this, filteredArgs);
                return result;
            },
            [9 /* InterceptorState.Has_____AM________VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                result = fi.implementation.apply(this, filteredArgs);
                fi.onAfterCallObserver.call.call(this, result);
                return result;
            },
            [10 /* InterceptorState.Has_____AM_____VM___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                result = fi.implementation.apply(this, filteredArgs);
                result = fi.onAfterCallMapper.call.call(this, result);
                return result;
            },
            [11 /* InterceptorState.Has_____AM_____VM_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                result = fi.implementation.apply(this, filteredArgs);
                result = fi.onAfterCallMapper.call.call(this, result);
                fi.onAfterCallObserver.call.call(this, result);
                return result;
            },
            [12 /* InterceptorState.Has_____AM_AO_______ */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onBeforeCallObserver.call.apply(this, filteredArgs)) {
                    result = fi.implementation.apply(this, filteredArgs);
                }
                return result;
            },
            [13 /* InterceptorState.Has_____AM_AO_____VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onBeforeCallObserver.call.apply(this, filteredArgs)) {
                    result = fi.implementation.apply(this, filteredArgs);
                    fi.onAfterCallObserver.call.call(this, result);
                }
                return result;
            },
            [14 /* InterceptorState.Has_____AM_AO__VM___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onBeforeCallObserver.call.apply(this, filteredArgs)) {
                    result = fi.implementation.apply(this, filteredArgs);
                    result = fi.onAfterCallMapper.call.call(this, result);
                }
                return result;
            },
            [15 /* InterceptorState.Has_____AM_AO__VM_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onBeforeCallObserver.call.apply(this, filteredArgs)) {
                    result = fi.implementation.apply(this, filteredArgs);
                    result = fi.onAfterCallMapper.call.call(this, result);
                    fi.onAfterCallObserver.call.call(this, result);
                }
                return result;
            },
            [16 /* InterceptorState.Has_AVM______________ */]: fi => function () {
                let result;
                const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                result = fi.implementation.apply(this, arguments);
                result = onValueMapper.call(this, result);
                return result;
            },
            [17 /* InterceptorState.Has_AVM____________VO */]: fi => function () {
                let result;
                const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                result = fi.implementation.apply(this, arguments);
                fi.onAfterCallObserver.call.call(this, result);
                result = onValueMapper.call(this, result);
                return result;
            },
            [18 /* InterceptorState.Has_AVM_________VM___ */]: fi => function () {
                let result;
                const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                result = fi.implementation.apply(this, arguments);
                result = fi.onAfterCallMapper.call.call(this, result);
                result = onValueMapper.call(this, result);
                return result;
            },
            [19 /* InterceptorState.Has_AVM_________VM_VO */]: fi => function () {
                let result;
                const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                result = fi.implementation.apply(this, arguments);
                result = fi.onAfterCallMapper.call.call(this, result);
                fi.onAfterCallObserver.call.call(this, result);
                result = onValueMapper.call(this, result);
                return result;
            },
            [20 /* InterceptorState.Has_AVM_____AO_______ */]: fi => function () {
                let result;
                if (!fi.onBeforeCallObserver.call.apply(this, arguments)) {
                    const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                    result = fi.implementation.apply(this, arguments);
                    result = onValueMapper.call(this, result);
                }
                return result;
            },
            [21 /* InterceptorState.Has_AVM_____AO_____VO */]: fi => function () {
                let result;
                if (!fi.onBeforeCallObserver.call.apply(this, arguments)) {
                    const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                    result = fi.implementation.apply(this, arguments);
                    fi.onAfterCallObserver.call.call(this, result);
                    result = onValueMapper.call(this, result);
                }
                return result;
            },
            [22 /* InterceptorState.Has_AVM_____AO__VM___ */]: fi => function () {
                let result;
                if (!fi.onBeforeCallObserver.call.apply(this, arguments)) {
                    const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                    result = fi.implementation.apply(this, arguments);
                    result = fi.onAfterCallMapper.call.call(this, result);
                    result = onValueMapper.call(this, result);
                }
                return result;
            },
            [23 /* InterceptorState.Has_AVM_____AO__VM_VO */]: fi => function () {
                let result;
                if (!fi.onBeforeCallObserver.call.apply(this, arguments)) {
                    const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                    result = fi.implementation.apply(this, arguments);
                    result = fi.onAfterCallMapper.call.call(this, result);
                    fi.onAfterCallObserver.call.call(this, result);
                    result = onValueMapper.call(this, result);
                }
                return result;
            },
            [24 /* InterceptorState.Has_AVM__AM__________ */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                result = fi.implementation.apply(this, filteredArgs);
                result = onValueMapper.call(this, result);
                return result;
            },
            [25 /* InterceptorState.Has_AVM__AM________VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                result = fi.implementation.apply(this, filteredArgs);
                fi.onAfterCallObserver.call.call(this, result);
                result = onValueMapper.call(this, result);
                return result;
            },
            [26 /* InterceptorState.Has_AVM__AM_____VM___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                result = fi.implementation.apply(this, filteredArgs);
                result = fi.onAfterCallMapper.call.call(this, result);
                result = onValueMapper.call(this, result);
                return result;
            },
            [27 /* InterceptorState.Has_AVM__AM_____VM_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                result = fi.implementation.apply(this, filteredArgs);
                result = fi.onAfterCallMapper.call.call(this, result);
                fi.onAfterCallObserver.call.call(this, result);
                result = onValueMapper.call(this, result);
                return result;
            },
            [28 /* InterceptorState.Has_AVM__AM_AO_______ */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onBeforeCallObserver.call.apply(this, filteredArgs)) {
                    const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                    result = fi.implementation.apply(this, filteredArgs);
                    result = onValueMapper.call(this, result);
                }
                return result;
            },
            [29 /* InterceptorState.Has_AVM__AM_AO_____VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onBeforeCallObserver.call.apply(this, filteredArgs)) {
                    const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                    result = fi.implementation.apply(this, filteredArgs);
                    fi.onAfterCallObserver.call.call(this, result);
                    result = onValueMapper.call(this, result);
                }
                return result;
            },
            [30 /* InterceptorState.Has_AVM__AM_AO__VM___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onBeforeCallObserver.call.apply(this, filteredArgs)) {
                    const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                    result = fi.implementation.apply(this, filteredArgs);
                    result = fi.onAfterCallMapper.call.call(this, result);
                    result = onValueMapper.call(this, result);
                }
                return result;
            },
            [31 /* InterceptorState.Has_AVM__AM_AO__VM_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onBeforeCallMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onBeforeCallObserver.call.apply(this, filteredArgs)) {
                    const onValueMapper = fi.onBeforeAndAterCallMapper.call.call(this, arguments);
                    result = fi.implementation.apply(this, filteredArgs);
                    result = fi.onAfterCallMapper.call.call(this, result);
                    fi.onAfterCallObserver.call.call(this, result);
                    result = onValueMapper.call(this, result);
                }
                return result;
            },
        };
        if (__DEV__) {
            // just to make sure we caovered all cases correctly
            for (let i = 8 /* InterceptorState.HasArgsMapper */ | 4 /* InterceptorState.HasArgsObserver */ | 2 /* InterceptorState.HasValueMapper */ | 1 /* InterceptorState.HasValueObserver */ | 16 /* InterceptorState.HasArgsAndValueMapper */; i >= 0; --i) {
                const ctor = ctors[i];
                assert(!!ctor, `unhandled interceptor state ${i}`);
                ctors[i] = fi => {
                    assert((i & 8 /* InterceptorState.HasArgsMapper */) === 0 || !!fi.onBeforeCallMapper, `missing expected .onArgsFilter for state ${i}`);
                    assert((i & 4 /* InterceptorState.HasArgsObserver */) === 0 || !!fi.onBeforeCallObserver, `missing expected .onArgsObserver for state ${i}`);
                    assert((i & 2 /* InterceptorState.HasValueMapper */) === 0 || !!fi.onAfterCallMapper, `missing expected .onValueFilter for state ${i}`);
                    assert((i & 1 /* InterceptorState.HasValueObserver */) === 0 || !!fi.onAfterCallObserver, `missing expected .onValueObserver for state ${i}`);
                    assert((i & 16 /* InterceptorState.HasArgsAndValueMapper */) === 0 || !!fi.onBeforeAndAterCallMapper, `missing expected .onArgsAndValueMapper for state ${i}`);
                    return ctor(fi);
                };
            }
        }
        return ctors;
    })();
    updateDispatcherFunc() {
        let state = 0;
        state |= this.onBeforeCallMapper ? 8 /* InterceptorState.HasArgsMapper */ : 0;
        state |= this.onBeforeCallObserver ? 4 /* InterceptorState.HasArgsObserver */ : 0;
        state |= this.onAfterCallMapper ? 2 /* InterceptorState.HasValueMapper */ : 0;
        state |= this.onAfterCallObserver ? 1 /* InterceptorState.HasValueObserver */ : 0;
        state |= this.onBeforeAndAterCallMapper ? 16 /* InterceptorState.HasArgsAndValueMapper */ : 0;
        //TODO: Check a cached version first
        const dispatcherCtor = FunctionInterceptor.dispatcherCtors[state];
        assert(!!dispatcherCtor, `unhandled interceptor state ${state}`);
        this.dispatcherFunc = dispatcherCtor(this);
    }
    //#region helper function to lazily extend hooks
    onBeforeCallMapperAdd(cb) {
        if (!this.onBeforeCallMapper) {
            this.onBeforeCallMapper = new OnBeforeCallMapper();
            this.updateDispatcherFunc();
        }
        return this.onBeforeCallMapper.add(cb);
    }
    onBeforeCallMapperRemove(cb) {
        if (this.onBeforeCallMapper?.remove(cb)) {
            // Since we rely on the output of the callback, we should avoid empty list
            if (!this.onBeforeCallMapper.hasCallback()) {
                this.onBeforeCallMapper = null;
            }
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onBeforeCallObserverAdd(cb) {
        if (!this.onBeforeCallObserver) {
            this.onBeforeCallObserver = new OnBeforeCallObserver();
            this.updateDispatcherFunc();
        }
        return this.onBeforeCallObserver.add(cb);
    }
    onBeforeCallObserverRemove(cb) {
        if (this.onBeforeCallObserver?.remove(cb)) {
            // Since we rely on the output of the callback, we should avoid empty list
            if (!this.onBeforeCallObserver.hasCallback()) {
                this.onBeforeCallObserver = null;
            }
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onAfterCallMapperAdd(cb) {
        if (!this.onAfterCallMapper) {
            this.onAfterCallMapper = new OnAfterCallMapper();
            this.updateDispatcherFunc();
        }
        return this.onAfterCallMapper.add(cb);
    }
    onAfterCallMapperRemove(cb) {
        if (this.onAfterCallMapper?.remove(cb)) {
            // Since we rely on the output of the callback, we should avoid empty list
            if (!this.onAfterCallMapper.hasCallback()) {
                this.onAfterCallMapper = null;
            }
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onAfterCallObserverAdd(cb) {
        if (!this.onAfterCallObserver) {
            this.onAfterCallObserver = new OnAfterCallObserver();
            this.updateDispatcherFunc();
        }
        return this.onAfterCallObserver.add(cb);
    }
    onAfterCallObserverRemove(cb) {
        if (this.onAfterCallObserver?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onBeforeAndAfterCallMapperAdd(cb) {
        if (!this.onBeforeAndAterCallMapper) {
            this.onBeforeAndAterCallMapper = new OnBeforeAndAfterCallMapper();
            this.updateDispatcherFunc();
        }
        return this.onBeforeAndAterCallMapper.add(cb);
    }
    onBeforeAndAfterCallMapperRemove(cb) {
        if (this.onBeforeAndAterCallMapper?.remove(cb)) {
            // Since we rely on the output of the callback, we should avoid empty list
            if (!this.onBeforeAndAterCallMapper.hasCallback()) {
                this.onBeforeAndAterCallMapper = null;
            }
            this.updateDispatcherFunc();
        }
        return cb;
    }
    //#endregion
    getData(dataPropName) {
        return this.data?.[dataPropName];
    }
    setData(dataPropName, value) {
        if (!this.data) {
            this.data = {};
        }
        this.data[dataPropName] = value;
    }
    testAndSet(dataPropName) {
        const currValue = this.getData(dataPropName) || false;
        if (!currValue) {
            this.setData(dataPropName, true);
        }
        return currValue;
    }
}
// & { [index: string]: any };
function getFunctionInterceptor(func) {
    return func?.[FuncExtensionPropName];
}
function setFunctionInterceptor(func, funcInterceptor) {
    __DEV__ && assert(typeof func === "function" &&
        !getFunctionInterceptor(func), `Function already has an interceptor assigned to it`, { logger: { error() { debugger; } } });
    func[FuncExtensionPropName] = funcInterceptor;
}
function interceptFunction(func, interceptOutput = false, fiCtor, name = `_annonymous`) {
    assert(typeof func === "function", `cannot intercept non-function input`);
    let funcInterceptor = getFunctionInterceptor(func);
    if (!funcInterceptor) {
        funcInterceptor = fiCtor
            ? new fiCtor(name, func, interceptOutput)
            : new FunctionInterceptor(name, func, interceptOutput);
    }
    return funcInterceptor;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
class MethodInterceptor extends FunctionInterceptor {
    constructor(name, shadowPrototype, interceptOutput = false, desc) {
        super(name, void 0, interceptOutput);
        this.interceptProperty(shadowPrototype.targetPrototype, false, desc);
        if (this.status !== 1 /* InterceptionStatus.Intercepted */) {
            shadowPrototype.addPendingPropertyInterceptor(this);
        }
    }
    interceptProperty(obj, isOwnProperty, desc) {
        desc = desc ?? getExtendedPropertyDescriptor(obj, this.name);
        if (isOwnProperty) {
            let virtualProperty; // TODO: we should do this on the object itself
            if (desc) {
                if (desc.writable && (desc.value || desc.hasOwnProperty("value"))) { // it has value and can change
                    virtualProperty = desc.value;
                    delete desc.value;
                    delete desc.writable;
                    desc.get = function () { return virtualProperty; };
                    desc.set = function (value) { virtualProperty = value; };
                    desc.configurable = true;
                }
            }
            else {
                desc = {
                    get: function () { return virtualProperty; },
                    set: function (value) { virtualProperty = value; },
                    enumerable: true,
                    configurable: true,
                    container: obj
                };
            }
        }
        if (desc) {
            if (desc.value) {
                this.setOriginal(desc.value);
                desc.value = this.interceptor;
                defineProperty(desc.container, this.name, desc);
                this.status = 1 /* InterceptionStatus.Intercepted */;
            }
            else if (desc.get || desc.set) {
                const that = this;
                const { get, set } = desc;
                if (get) {
                    desc.get = function () {
                        const originalFunc = get.call(this);
                        if (typeof originalFunc !== "function") {
                            return originalFunc; // getter didn't return a func, should maintain that!
                        }
                        if (originalFunc !== that.interceptor) {
                            that.setOriginal(originalFunc);
                        }
                        return that.interceptor;
                    };
                    setFunctionInterceptor(desc.get, that);
                }
                if (set) {
                    desc.set = function (value) {
                        // set.call(this, value);
                        set.call(this, that.interceptor);
                        if (value !== that.interceptor && value !== that.original) {
                            that.setOriginal(value);
                        }
                        return that.interceptor;
                    };
                    setFunctionInterceptor(desc.set, that);
                }
                defineProperty(desc.container, this.name, desc);
                this.status = desc.configurable ? 1 /* InterceptionStatus.Intercepted */ : 4 /* InterceptionStatus.NotConfigurable */;
            }
            else if (desc.hasOwnProperty("value")) {
                /**
                 * There was a .value = null on the prototype chain. We can assume this value will not change and just
                 * ignore it.
                 * We could also treat this just like the (isOwnProperty && desc.hasOwnProperty('value')) above, but
                 * that does not seem to provide any value.
                 * Also, since this is supposed to be a function, we would not expect other falsy values here (i.e. "", 0, ...)
                 * Only null would be fine
                 *  */
                __DEV__ && assert(desc.value === null, `unexpected situation! PropertyDescriptor.value must be function or null!`);
                this.status = 1 /* InterceptionStatus.Intercepted */;
            }
            else {
                __DEV__ && assert(false, `unexpected situation! PropertyDescriptor does not have value or get/set!`);
            }
        }
        else {
            this.status = 2 /* InterceptionStatus.NotFound */;
        }
    }
    interceptObjectOwnProperties(obj) {
        this.interceptProperty(obj, true);
    }
}
function getMethodInterceptor(name, shadowPrototype) {
    const desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, name);
    let fi;
    if (desc) {
        fi = getFunctionInterceptor(desc.value);
        if (!fi) {
            /**
             * let's try getter/setter as well.
             * we know this is special case (see above) and interceptor is really about the actual func, not its getter/setters
             * so, we need to supress the type of getter/setter
             */
            const getFI = getFunctionInterceptor(desc.get);
            const setFI = getFunctionInterceptor(desc.set);
            assert(!(getFI && setFI) || (getFI === setFI), `Getter/Setter of method ${name} have differnt interceptors`);
            fi = getFI ?? setFI;
        }
        desc.interceptor = fi;
    }
    return desc;
}
function interceptMethod(name, shadowPrototype, interceptOutput = false, miCtor) {
    const desc = getMethodInterceptor(name, shadowPrototype);
    return desc?.interceptor ?? new (miCtor ?? MethodInterceptor)(name, shadowPrototype, interceptOutput, desc);
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
function createCtorInterceptor(ctorFunc) {
    const ctorInterceptor = function () {
        // let result = new ctorFunc(...arguments);
        // return result;
        // NOTE: if we see some browsers may not support ...argument, we should then try the following
        let result;
        switch (arguments.length) {
            case 0:
                result = new ctorFunc();
                break;
            case 1:
                result = new ctorFunc(arguments[0]);
                break;
            case 2:
                result = new ctorFunc(arguments[0], arguments[1]);
                break;
            case 3:
                result = new ctorFunc(arguments[0], arguments[1], arguments[2]);
                break;
            case 4:
                result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3]);
                break;
            case 5:
                result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
                break;
            case 6:
                result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                break;
            default: throw "Unsupported case!";
        }
        return result;
    };
    copyOwnProperties(ctorFunc, ctorInterceptor);
    return ctorInterceptor;
}
class ConstructorInterceptor extends FunctionInterceptor {
    ctorInterceptor = null;
    constructor(name, originalCtor) {
        super(name, originalCtor, true); //If we intercept constructor, that means we want the output to be intercepted
    }
    setOriginal(originalFunc) {
        this.ctorInterceptor = createCtorInterceptor(originalFunc);
        return super.setOriginal(this.ctorInterceptor);
    }
}
function interceptConstructor(ctor, name = `_annonymousCtor`) {
    return interceptFunction(ctor, true, ConstructorInterceptor, name);
}
class ConstructorMethodInterceptor extends MethodInterceptor {
    ctorInterceptor = null;
    constructor(name, shadowPrototype, desc) {
        super(name, shadowPrototype, true, desc); //If we intercept constructor, that means we want the output to be intercepted
    }
    setOriginal(originalFunc) {
        this.ctorInterceptor = createCtorInterceptor(originalFunc);
        return super.setOriginal(this.ctorInterceptor);
    }
}
function interceptConstructorMethod(name, shadowPrototype) {
    const desc = getMethodInterceptor(name, shadowPrototype);
    return desc?.interceptor ?? new ConstructorMethodInterceptor(name, shadowPrototype, desc);
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
function getVirtualPropertyName(name, extension) {
    return extension?.useCaseInsensitivePropertyName ? ('' + name).toLocaleLowerCase() : name;
}
class ShadowPrototype {
    targetPrototype;
    parentShadowPrototype;
    extension;
    onBeforInterceptObj = new Hook();
    onAfterInterceptObj = new Hook();
    pendingPropertyInterceptors;
    constructor(targetPrototype, parentShadowPrototype) {
        this.targetPrototype = targetPrototype;
        this.parentShadowPrototype = parentShadowPrototype;
        /**
         * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
         * in the following methods
         */
        this.extension = Object.create(parentShadowPrototype?.extension ?? null);
        if ( /* __DEV__ && */this.parentShadowPrototype) {
            let obj = this.targetPrototype;
            let proto = this.parentShadowPrototype.targetPrototype;
            let matched = false;
            while (obj && !matched) {
                matched = obj === proto;
                obj = Object.getPrototypeOf(obj);
            }
            assert(matched, `Invalid prototype chain`);
        }
    }
    callOnBeforeInterceptObject(obj) {
        this.parentShadowPrototype?.callOnBeforeInterceptObject(obj);
        this.onBeforInterceptObj?.call(obj);
    }
    callOnAfterInterceptObject(obj) {
        this.parentShadowPrototype?.callOnAfterInterceptObject(obj);
        this.onAfterInterceptObj?.call(obj);
    }
    interceptObjectItself(obj) {
        this.parentShadowPrototype?.interceptObjectItself(obj);
        // We can make any necessary modificatio to the object itself here
        if (this.pendingPropertyInterceptors) {
            for (const pi of this.pendingPropertyInterceptors) {
                pi.interceptObjectOwnProperties(obj);
            }
        }
    }
    interceptObject(obj) {
        // This behaves similar to how constructors work, i.e. from parent class to child class
        this.callOnBeforeInterceptObject(obj);
        this.interceptObjectItself(obj);
        this.callOnAfterInterceptObject(obj);
    }
    addPendingPropertyInterceptor(pi) {
        if (!this.pendingPropertyInterceptors) {
            this.pendingPropertyInterceptors = [];
        }
        this.pendingPropertyInterceptors.push(pi);
    }
    getVirtualProperty(name) {
        const vtable = this.extension;
        const canonicalName = getVirtualPropertyName(name, vtable);
        return vtable[canonicalName];
    }
    setVirtualProperty(name, virtualProp) {
        const vtable = this.extension;
        const canonicalName = getVirtualPropertyName(name, vtable);
        if (__DEV__) {
            assert(!hasOwnProperty(vtable, canonicalName), `Vritual property ${name} already exists`);
            assert(!vtable[canonicalName], `virtual property ${name} will override the parent's.`, { logger: { error(msg) { console.warn(msg); } } });
        }
        vtable[canonicalName] = virtualProp;
        return virtualProp;
    }
    removeVirtualPropery(name, virtualProp) {
        const vtable = this.extension;
        const canonicalName = getVirtualPropertyName(name, vtable);
        if (__DEV__) {
            assert(hasOwnProperty(vtable, canonicalName), `Vritual property ${name} does not exists`);
        }
        if (vtable[canonicalName] === virtualProp) {
            delete vtable[canonicalName];
        }
        else {
            console.error(`Vritual property ${name} does not match and was not deleted`);
        }
    }
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
class ModuleRuntimeBase {
    getExports(_moduleId) {
        return null;
    }
    updateExports(_moduleId, _moduleExports, _moduleExportsInterceptors, _failedExportsKeys) {
    }
}
class WebpackModuleRuntime extends ModuleRuntimeBase {
    _cache;
    constructor(_cache) {
        super();
        this._cache = _cache;
    }
    getExports(moduleId) {
        const modulePath = new RegExp(`${moduleId}(?:/index)?[.]js$`);
        const wexports = Object.keys(this._cache).filter(m => modulePath.test(m)).map(m => this._cache[m]);
        return wexports[0].exports;
    }
}
class MetaModuleRuntime extends ModuleRuntimeBase {
    _cache;
    constructor(_cache) {
        super();
        this._cache = _cache;
    }
    updateExports(moduleId, moduleExports, moduleExportsInterceptors, _failedExportsKeys) {
        /**
      * Currently, the module system in Meta uses a different mechanism to import
      * normal vs. default modules. In order to make sure default exports are also
      * handled properly, we use the following back channel to grap the module data
      * and update the values.
      * See the details in https://www.internalfb.com/code/www/[diffs]/html/shared_core/polyfill/fbmodule-runtime.js?lines=373-378
      */
        if (moduleExportsInterceptors.default != null) {
            this._cache.modulesMap[moduleId].defaultExport = moduleExports.default;
        }
    }
}
const ModuleRuntime = (() => {
    if (typeof __webpack_module_cache__ === 'object') {
        // In webpack world
        return new WebpackModuleRuntime(__webpack_module_cache__);
    }
    else if (typeof require === "function") {
        try {
            const __debug = require("__debug");
            if (typeof __debug === "object") {
                // In Meta custom runtime world
                return new MetaModuleRuntime(__debug);
            }
        }
        catch (e) { }
    }
    return new ModuleRuntimeBase();
})();
function interceptModuleExports(moduleId, moduleExports, moduleExportsKeys, failedExportsKeys) {
    let interceptableModuleExports = moduleExports;
    const alternativeExports = ModuleRuntime.getExports(moduleId);
    if (alternativeExports && alternativeExports !== interceptableModuleExports) {
        console.warn('different exports objects ', moduleId);
        interceptableModuleExports = alternativeExports;
    }
    const ModuleExportsShadow = new ShadowPrototype(interceptableModuleExports, null);
    const IModule = {};
    for (let i = 0; i < moduleExportsKeys.length; ++i) {
        const key = moduleExportsKeys[i];
        IModule[key] = interceptMethod(key, ModuleExportsShadow);
    }
    ModuleRuntime.updateExports(moduleId, moduleExports, IModule, failedExportsKeys);
    validateModuleInterceptor(moduleId, moduleExports, IModule, failedExportsKeys);
    return IModule;
}
function validateModuleInterceptor(moduleId, moduleExports, moduleExportsInterceptors, failedExportsKeys) {
    if (Array.isArray(failedExportsKeys)) {
        const moduleExportsKeys = Object.keys(moduleExportsInterceptors);
        for (let i = 0; i < moduleExportsKeys.length; ++i) {
            const key = moduleExportsKeys[i];
            if (moduleExports[key] !== moduleExportsInterceptors[key].interceptor) {
                failedExportsKeys.push(key);
            }
        }
        assert(failedExportsKeys.length === 0, failedExportsKeys.map(key => `could not intercept ${moduleId}.${key}`).join("\n"));
    }
}

const IRequire = /*#__PURE__*/Object.freeze({
  __proto__: null,
  interceptModuleExports,
  validateModuleInterceptor
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
/**
 * Usually in test environment, this module may be initialized multiple times.
 * But since it updates the global primodials, we should be careful to not redo
 * all the interception again. Specially since interceptMethod will pickup the
 * right (original) set of interceptors, we don't want to have a different ShadowPrototype
 *
 * Also, in hyperion-dom, we do have interception of Window which is the globalThis of the browsers
 * That module will need to set the parent of the shadow prototype and register a few more information
 * To ensure that no one is really using the internal hooks of the ShadowPrototype for tracking object interception
 * the following IGlobalThisPrototype is kept local to this module and not exported. As of now all usecases of the
 * hyperion is in browser, if/when we support nodejs, there should be a similar mechanism for handling that environments
 * globalThis.
 * For this particular case, we are ok if the ShadowPrototype is not used.
 */
const IGlobalThisPrototype = getOwnShadowPrototypeOf(globalScope) ?? new ShadowPrototype(globalScope, null);
const setInterval = interceptMethod("setInterval", IGlobalThisPrototype);
const setTimeout = interceptMethod("setTimeout", IGlobalThisPrototype);
const IPromiseConstructor = interceptConstructorMethod("Promise", IGlobalThisPrototype);

const IGlobalThis = /*#__PURE__*/Object.freeze({
  __proto__: null,
  IPromiseConstructor,
  setInterval,
  setTimeout
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
const PromisePrototype = Object.getPrototypeOf(Promise.resolve());
/**
 * Usually in test environment, this module may be initialized multiple times.
 * But since it updates the global primodials, we should be careful to not redo
 * all the interception again. Specially since interceptMethod will pickup the
 * right (original) set of interceptors, we don't want to have a different ShadowPrototype
 */
const IPromisePrototype = getOwnShadowPrototypeOf(PromisePrototype) ?? registerShadowPrototype(PromisePrototype, new ShadowPrototype(PromisePrototype, null));
const constructor = IPromiseConstructor;
const then = interceptMethod("then", IPromisePrototype);
const Catch = interceptMethod("catch", IPromisePrototype);
const Finally = interceptMethod("finally", IPromisePrototype);
// The container for static methods
const IPromise = getOwnShadowPrototypeOf(Promise) ?? registerShadowPrototype(Promise, new ShadowPrototype(Promise, null));
const all = interceptMethod("all", IPromise);
const allSettled = interceptMethod("allSettled", IPromise);
const any = interceptMethod("any", IPromise);
const race = interceptMethod("race", IPromise);
const reject = interceptMethod("reject", IPromise);
const resolve = interceptMethod("resolve", IPromise);

const IPromise$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Catch,
  Finally,
  IPromisePrototype,
  all,
  allSettled,
  any,
  constructor,
  race,
  reject,
  resolve,
  then
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
const ATTRIBUTE_INTERCEPTOR_PROP_NAME = "__attributeInterceptor";
class AttributeInterceptorBase extends PropertyInterceptor {
    getter;
    setter;
    constructor(name, getter, setter) {
        super(name);
        this.getter = new FunctionInterceptor(name, getter);
        this.setter = new FunctionInterceptor(name, setter);
        this.getter.setData(ATTRIBUTE_INTERCEPTOR_PROP_NAME, this);
        this.setter.setData(ATTRIBUTE_INTERCEPTOR_PROP_NAME, this);
    }
}
class AttributeInterceptor extends AttributeInterceptorBase {
    constructor(name, shadowPrototype, desc) {
        super(name);
        this.interceptProperty(shadowPrototype.targetPrototype, false, desc);
        if (this.status !== 1 /* InterceptionStatus.Intercepted */) {
            shadowPrototype.addPendingPropertyInterceptor(this);
        }
    }
    interceptProperty(obj, isOwnProperty, desc) {
        desc = desc ?? getExtendedPropertyDescriptor(obj, this.name);
        if (isOwnProperty) {
            let virtualProperty; // TODO: we should do this on the object itself
            const get = function () {
                return virtualProperty;
            };
            const set = function (value) {
                virtualProperty = value;
            };
            if (desc) {
                if (desc.value && desc.writable) { // it has value and can change
                    virtualProperty = desc.value;
                    delete desc.value;
                    delete desc.writable;
                    desc.get = get;
                    desc.set = set;
                    desc.configurable = true;
                }
            }
            else {
                desc = {
                    get,
                    set,
                    enumerable: true,
                    configurable: true,
                    container: obj
                };
            }
        }
        if (desc) {
            if (desc.get || desc.set) {
                const { get, set } = desc;
                if (get) {
                    this.getter.setOriginal(get);
                    desc.get = this.getter.interceptor;
                }
                if (set) {
                    this.setter.setOriginal(set);
                    desc.set = this.setter.interceptor;
                }
                __DEV__ && assert(desc.configurable, `Cannot intercept attribute ${this.name}`);
                defineProperty(desc.container, this.name, desc);
                if (__DEV__) {
                    const desc = getExtendedPropertyDescriptor(obj, this.name);
                    assert(desc?.get === this.getter.interceptor, `getter interceptor did not work`);
                    assert(desc?.set === this.setter.interceptor, `setter interceptor did not work`);
                }
                this.status = desc.configurable ? 1 /* InterceptionStatus.Intercepted */ : 4 /* InterceptionStatus.NotConfigurable */;
            }
            else if (desc.value) {
                //TODO: we should replace this one with get/set
                console.warn(`Property ${this.name} does not seem to be an attribute`);
                this.status = 3 /* InterceptionStatus.NoGetterSetter */;
            }
            else {
                if (__DEV__) {
                    if (hasOwnProperty(desc, "get") || hasOwnProperty(desc, "set")) {
                        console.warn(`Un expected situation, attribute ${this.name} does not have getter/setter defined`);
                    }
                }
            }
        }
        else {
            this.status = 2 /* InterceptionStatus.NotFound */;
        }
    }
    interceptObjectOwnProperties(obj) {
        return this.interceptProperty(obj, true);
    }
}
function getAttributeInterceptor(name, shadowPrototype) {
    const desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, name);
    if (desc) {
        /**
         * let's try getter/setter as well.
         * we know this is special case (see above) and interceptor is really about the actual func, not its getter/setters
         * so, we need to supress the type of getter/setter
         */
        const getFI = getFunctionInterceptor(desc.get);
        const setFI = getFunctionInterceptor(desc.set);
        const getAI = getFI?.getData(ATTRIBUTE_INTERCEPTOR_PROP_NAME);
        const setAI = setFI?.getData(ATTRIBUTE_INTERCEPTOR_PROP_NAME);
        assert(!(getAI && setAI) || (getAI === setAI), `Getter/Setter of attribute ${name} have differnt interceptors`);
        desc.interceptor = getAI ?? setAI;
    }
    return desc;
}
function interceptAttributeBase(name, shadowPrototype, attributeInterceptorCtor) {
    const desc = getAttributeInterceptor(name, shadowPrototype);
    return desc?.interceptor ?? new attributeInterceptorCtor(name, shadowPrototype, desc);
}
function interceptAttribute(name, shadowPrototype) {
    return interceptAttributeBase(name, shadowPrototype, AttributeInterceptor);
}

export { AttributeInterceptor, AttributeInterceptorBase, Catch, IGlobalThis, IPromise$1 as IPromise, IPromisePrototype, IRequire, ShadowPrototype, all, allSettled, any, constructor, getFunctionInterceptor, getObjectExtension, getOwnShadowPrototypeOf, getVirtualPropertyValue, intercept, interceptAttribute, interceptAttributeBase, interceptConstructor, interceptConstructorMethod, interceptFunction, interceptMethod, interceptModuleExports, race, registerShadowPrototype, registerShadowPrototypeGetter, reject, resolve, setInterval, setTimeout, setVirtualPropertyValue, then, validateModuleInterceptor };
