/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates. All Rights Reserved.
 *
 * This file is auto generated from the Hyperion project hosted on
 * https://github.com/facebookincubator/hyperion
 * Instead of changing this file, you should:
 * - git clone https://github.com/facebookincubator/hyperion
 * - npm install
 * - npm run install-packages
 * - <make necessary modifications>
 * - npm run build
 * - <copy the 'hyperion/dist/hyperion.js' file
 *
 * @generated SignedSource<<08411d9f4a630be70617b13b3a5bcc0e>>
 */

    

/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates. All Rights Reserved.
 */
if (typeof global === "object"
    && typeof __DEV__ !== "boolean") {
    if (global?.process?.env?.JEST_WORKER_ID ||
        global?.process?.env?.NODE_ENV === 'development') {
        global["__DEV__"] = true;
    }
}

const devOptions = {
    getCallStack: () => [],
    logger: console,
};
function assert(condition, message, options) {
    if (!condition) {
        const callStackGetter = options?.getCallStack ?? devOptions.getCallStack;
        const logger = options?.logger ?? devOptions.logger;
        const callStack = callStackGetter(2);
        if (callStack && callStack.length > 0) {
            logger.error(message, callStack);
        }
        else {
            logger.error(message);
        }
    }
}

const EmptyCallback = () => { };
class Hook {
    _callbacks;
    call = EmptyCallback;
    hasCallback(cb) {
        if (!this._callbacks) {
            return cb ? this.call === cb : this.call !== EmptyCallback;
        }
        else {
            const callbacks = this._callbacks;
            return (callbacks.length > 0 &&
                (!cb ||
                    callbacks.some(func => func === cb || func._original === cb)));
        }
    }
    createMultiCallbackCall(callbacks) {
        const call = function () {
            const currentCallbacks = callbacks; // We could also use this._callbacks
            for (const cb of currentCallbacks) {
                cb.apply(this, arguments);
            }
        };
        return call;
    }
    add(cb, once) {
        let callback = cb;
        if (once) {
            const that = this;
            const tmp = function () {
                that.remove(tmp);
                return cb.apply(this, arguments);
            };
            tmp._original = cb;
            callback = tmp;
        }
        if (this.call === EmptyCallback) {
            this.call = callback;
        }
        else if (!this._callbacks) {
            this._callbacks = [this.call, callback];
            this.call = this.createMultiCallbackCall(this._callbacks);
        }
        else {
            this._callbacks.push(callback);
        }
        return cb;
    }
    remove(cb) {
        return this.removeIf(f => f === cb);
    }
    removeIf(condition) {
        /**
         * Two cases to consider:
         * - remove may be called while a .call is going on, we should make sure
         *   changing the _callbacks list while running them will not break the
         *   ongoing .call, otherwise the index gets messed up.
         * - a listener may have been added multiple times (although a bad practice)
         * So, we make a new copy of the _callbacks list
         * Since remove is called less often, it is ok to make this function more
         * expensive than .call (e.g. detecting when a .call is running)
         */
        if (this._callbacks) {
            const previousList = this._callbacks;
            this._callbacks = previousList.filter(l => !condition(l));
            // Alternatively we can find the index of cb and just replace it with EmptyCallback
            return previousList.length > this._callbacks.length;
        }
        else if (condition(this.call)) {
            this.call = EmptyCallback;
            return true;
        }
        else {
            return false;
        }
    }
    clear() {
        if (this.call === EmptyCallback || !this._callbacks) {
            this.call = EmptyCallback;
        }
        else {
            this._callbacks.length = 0;
        }
    }
}

class PropertyInterceptor {
    name;
    status = 0 /* Unknown */;
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

const unknownFunc = function () {
    console.warn('Unknown or missing function called! ');
};
class OnArgsFilter extends Hook {
}
class OnArgsObserver extends Hook {
}
class OnValueFilter extends Hook {
}
class OnValueObserver extends Hook {
}
class FunctionInterceptorBase extends PropertyInterceptor {
    onArgsFilter;
    onArgsObserver;
    onValueFilter;
    onValueObserver;
    original;
    interceptor;
    dispatcherFunc;
    constructor(name, originalFunc = unknownFunc) {
        super(name);
        const that = this;
        this.interceptor = function () {
            return that.dispatcherFunc.apply(this, arguments);
        };
        this.original = originalFunc;
        this.dispatcherFunc = this.original; // By default just pass on to original
    }
    setOriginal(originalFunc) {
        this.original = originalFunc;
        this.updateDispatcherFunc();
    }
    static dispatcherCtors = (() => {
        // type T = { "foo": InterceptableFunction };
        // const ctors: { [index: number]: (fi: FunctionInterceptor<"foo", T>) => Function } = {
        const ctors = {
            [0 /* Has_____________ */]: fi => fi.original,
            [1 /* Has___________VO */]: fi => function () {
                let result;
                result = fi.original.apply(this, arguments);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [2 /* Has________VF___ */]: fi => function () {
                let result;
                result = fi.original.apply(this, arguments);
                result = fi.onValueFilter.call.call(this, result);
                return result;
            },
            [3 /* Has________VF_VO */]: fi => function () {
                let result;
                result = fi.original.apply(this, arguments);
                result = fi.onValueFilter.call.call(this, result);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [4 /* Has____AO_______ */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                }
                return result;
            },
            [5 /* Has____AO_____VO */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [6 /* Has____AO__VF___ */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    result = fi.onValueFilter.call.call(this, result);
                }
                return result;
            },
            [7 /* Has____AO__VF_VO */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    result = fi.onValueFilter.call.call(this, result);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [8 /* Has_AF__________ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                return result;
            },
            [9 /* Has_AF________VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [10 /* Has_AF_____VF___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                result = fi.onValueFilter.call.call(this, result);
                return result;
            },
            [11 /* Has_AF_____VF_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                result = fi.onValueFilter.call.call(this, result);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [12 /* Has_AF_AO_______ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                }
                return result;
            },
            [13 /* Has_AF_AO_____VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [14 /* Has_AF_AO__VF___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    result = fi.onValueFilter.call.call(this, result);
                }
                return result;
            },
            [15 /* Has_AF_AO__VF_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    result = fi.onValueFilter.call.call(this, result);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
        };
        if (__DEV__) {
            // just to make sure we caovered all cases correctly
            for (let i = 8 /* HasArgsFilter */ | 4 /* HasArgsObserver */ | 2 /* HasValueFilter */ | 1 /* HasValueObserver */; i >= 0; --i) {
                const ctor = ctors[i];
                assert(!!ctor, `unhandled interceptor state ${i}`);
                ctors[i] = fi => {
                    assert((i & 8 /* HasArgsFilter */) === 0 || !!fi.onArgsFilter, `missing expected .onArgsFilter for state ${i}`);
                    assert((i & 4 /* HasArgsObserver */) === 0 || !!fi.onArgsObserver, `missing expected .onArgsObserver for state ${i}`);
                    assert((i & 2 /* HasValueFilter */) === 0 || !!fi.onValueFilter, `missing expected .onValueFilter for state ${i}`);
                    assert((i & 1 /* HasValueObserver */) === 0 || !!fi.onValueObserver, `missing expected .onValueObserver for state ${i}`);
                    return ctor(fi);
                };
            }
        }
        return ctors;
    })();
    updateDispatcherFunc() {
        let state = 0;
        state |= this.onArgsFilter ? 8 /* HasArgsFilter */ : 0;
        state |= this.onArgsObserver ? 4 /* HasArgsObserver */ : 0;
        state |= this.onValueFilter ? 2 /* HasValueFilter */ : 0;
        state |= this.onValueObserver ? 1 /* HasValueObserver */ : 0;
        //TODO: Check a cached version first
        const dispatcherCtor = FunctionInterceptorBase.dispatcherCtors[state];
        assert(!!dispatcherCtor, `unhandled interceptor state ${state}`);
        this.dispatcherFunc = dispatcherCtor(this);
    }
    //#region helper function to lazily extend hooks
    onArgsFilterAdd(cb) {
        if (!this.onArgsFilter) {
            this.onArgsFilter = new OnArgsFilter();
            this.updateDispatcherFunc();
        }
        return this.onArgsFilter.add(cb);
    }
    onArgsFilterRemove(cb) {
        if (this.onArgsFilter?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onArgsObserverAdd(cb) {
        if (!this.onArgsObserver) {
            this.onArgsObserver = new OnArgsObserver();
            this.updateDispatcherFunc();
        }
        return this.onArgsObserver.add(cb);
    }
    onArgsObserverRemove(cb) {
        if (this.onArgsObserver?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onValueFilterAdd(cb) {
        if (!this.onValueFilter) {
            this.onValueFilter = new OnValueFilter();
            this.updateDispatcherFunc();
        }
        return this.onValueFilter.add(cb);
    }
    onValueFilterRemove(cb) {
        if (this.onValueFilter?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onValueObserverAdd(cb) {
        if (!this.onValueObserver) {
            this.onValueObserver = new OnValueObserver();
            this.updateDispatcherFunc();
        }
        return this.onValueObserver.add(cb);
    }
    onValueObserverRemove(cb) {
        if (this.onValueObserver?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
}
class FunctionInterceptor extends FunctionInterceptorBase {
    constructor(name, shadowPrototype) {
        super(name);
        this.interceptProperty(shadowPrototype.targetPrototype, false);
        if (this.status !== 1 /* Intercepted */) {
            shadowPrototype.addPendingPropertyInterceptor(this);
        }
    }
    interceptProperty(obj, isOwnProperty) {
        let desc = getExtendedPropertyDescriptor(obj, this.name);
        if (isOwnProperty) {
            let virtualProperty; // TODO: we should do this on the object itself
            if (desc) {
                if (desc.value && desc.writable) { // it has value and can change
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
                this.status = 1 /* Intercepted */;
            }
            else if (desc.get || desc.set) {
                const that = this;
                const { get, set } = desc;
                if (get) {
                    desc.get = function () {
                        const originalFunc = get.call(this);
                        if (originalFunc !== that.interceptor) {
                            that.setOriginal(originalFunc);
                        }
                        return that.interceptor;
                    };
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
                }
                defineProperty(desc.container, this.name, desc);
                this.status = desc.configurable ? 1 /* Intercepted */ : 4 /* NotConfigurable */;
            }
            else {
                __DEV__ && assert(false, `unexpected situation! PropertyDescriptor does not have value or get/set!`);
            }
        }
        else {
            this.status = 2 /* NotFound */;
        }
    }
    interceptObjectOwnProperties(obj) {
        this.interceptProperty(obj, true);
    }
}

class ShadowPrototype {
    targetPrototype;
    parentShadoPrototype;
    extension;
    onBeforInterceptObj = new Hook();
    onAfterInterceptObj = new Hook();
    pendingPropertyInterceptors;
    constructor(targetPrototype, parentShadoPrototype) {
        this.targetPrototype = targetPrototype;
        this.parentShadoPrototype = parentShadoPrototype;
        /**
         * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
         * in the following methods
         */
        this.extension = Object.create(parentShadoPrototype?.extension ?? null);
        if ( /* __DEV__ && */this.parentShadoPrototype) {
            let obj = this.targetPrototype;
            let proto = this.parentShadoPrototype.targetPrototype;
            let matched = false;
            while (obj && !matched) {
                matched = obj === proto;
                obj = Object.getPrototypeOf(obj);
            }
            assert(matched, `Invalid prototype chain`);
        }
    }
    callOnBeforeInterceptObject(obj) {
        this.parentShadoPrototype?.callOnBeforeInterceptObject(obj);
        this.onBeforInterceptObj?.call(obj);
    }
    callOnAfterInterceptObject(obj) {
        this.parentShadoPrototype?.callOnAfterInterceptObject(obj);
        this.onAfterInterceptObj?.call(obj);
    }
    interceptObjectItself(obj) {
        this.parentShadoPrototype?.interceptObjectItself(obj);
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
}

class DOMShadowPrototype extends ShadowPrototype {
    constructor(targetPrototypeCtor, parentShadoPrototype, options) {
        let targetPrototype = targetPrototypeCtor?.prototype;
        if (!targetPrototype && options) {
            const { sampleObject, nodeName, nodeType } = options;
            let obj = sampleObject;
            if (!obj && nodeType) {
                switch (nodeType) {
                    // case window.document.ATTRIBUTE_NODE: obj = document.createElement(""); break;
                    // case window.document.CDATA_SECTION_NODE: obj = document.createElement(""); break;
                    // case window.document.COMMENT_NODE: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_FRAGMENT_NODE: obj = document.createElement(""); break;
                    case window.document.DOCUMENT_NODE:
                        obj = window.document;
                        break;
                    // case window.document.DOCUMENT_POSITION_CONTAINED_BY: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_CONTAINS: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_DISCONNECTED: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_FOLLOWING: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_POSITION_PRECEDING: obj = document.createElement(""); break;
                    // case window.document.DOCUMENT_TYPE_NODE: obj = document.createElement(""); break;
                    case window.document.ELEMENT_NODE:
                        obj = sampleHTMLElement;
                        break;
                    // case window.document.ENTITY_NODE: obj = document.createElement(""); break;
                    // case window.document.ENTITY_REFERENCE_NODE: obj = document.createElement(""); break;
                    // case window.document.NOTATION_NODE: obj = document.createElement(""); break;
                    // case window.document.PROCESSING_INSTRUCTION_NODE: obj = document.createElement(""); break;
                    // case window.document.TEXT_NODE: obj = document.createElement(""); break;
                    default:
                        assert(false, `Unsupported and unexpected nodeType ${nodeType}`);
                        break;
                }
            }
            if (!obj && nodeName) {
                obj = window.document.createElement(nodeName);
            }
            if (obj) {
                targetPrototype = Object.getPrototypeOf(obj);
            }
        }
        assert(typeof targetPrototype === "object", `Cannot create shadow prototype for undefined`);
        super(targetPrototype, parentShadoPrototype);
    }
}
const sampleHTMLElement = window.document.head;

const IEventTargetPrototype = new DOMShadowPrototype(EventTarget, null, { sampleObject: sampleHTMLElement });
new FunctionInterceptor('addEventListener', IEventTargetPrototype);
new FunctionInterceptor('dispatchEvent', IEventTargetPrototype);
new FunctionInterceptor('removeEventListener', IEventTargetPrototype);

const INodePrototype = new DOMShadowPrototype(Node, IEventTargetPrototype, { sampleObject: sampleHTMLElement });
const appendChild = new FunctionInterceptor('appendChild', INodePrototype);
const cloneNode = new FunctionInterceptor('cloneNode', INodePrototype);
const insertBefore = new FunctionInterceptor('insertBefore', INodePrototype);
const removeChild = new FunctionInterceptor('removeChild', INodePrototype);
const replaceChild = new FunctionInterceptor('replaceChild', INodePrototype);

const INode = /*#__PURE__*/Object.freeze({
    __proto__: null,
    INodePrototype,
    appendChild,
    cloneNode,
    insertBefore,
    removeChild,
    replaceChild
});

class AttributeInterceptor extends PropertyInterceptor {
    getter;
    setter;
    constructor(name, shadowPrototype) {
        super(name);
        this.getter = new FunctionInterceptorBase(name);
        this.setter = new FunctionInterceptorBase(name);
        this.interceptProperty(shadowPrototype.targetPrototype, false);
        if (this.status !== 1 /* Intercepted */) {
            shadowPrototype.addPendingPropertyInterceptor(this);
        }
    }
    interceptProperty(obj, isOwnProperty) {
        let desc = getExtendedPropertyDescriptor(obj, this.name);
        if (isOwnProperty) {
            let virtualProperty; // TODO: we should do this on the object itself
            if (desc) {
                if (desc.value && desc.writable) { // it has value and can change
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
                    let desc = getExtendedPropertyDescriptor(obj, this.name);
                    assert(desc?.get === this.getter.interceptor, `getter interceptor did not work`);
                    assert(desc?.set === this.setter.interceptor, `setter interceptor did not work`);
                }
                this.status = desc.configurable ? 1 /* Intercepted */ : 4 /* NotConfigurable */;
            }
            else if (desc.value) {
                //TODO: we should replace this one with get/set
                console.warn(`Property ${this.name} does not seem to be an attribute`);
                this.status = 3 /* NoGetterSetter */;
            }
            else {
                if (__DEV__) {
                    if (desc.hasOwnProperty("get") || desc.hasOwnProperty("set")) {
                        console.warn(`Un expected situation, attribute ${this.name} does not have getter/setter defined`);
                    }
                }
            }
        }
        else {
            this.status = 2 /* NotFound */;
        }
    }
    interceptObjectOwnProperties(obj) {
        return this.interceptProperty(obj, true);
    }
}

const IElementtPrototype = new DOMShadowPrototype(Element, INodePrototype, { sampleObject: sampleHTMLElement });
const getAttribute = new FunctionInterceptor('getAttribute', IElementtPrototype);
const getAttributeNS = new FunctionInterceptor('getAttributeNS', IElementtPrototype);
const getAttributeNames = new FunctionInterceptor('getAttributeNames', IElementtPrototype);
const getAttributeNode = new FunctionInterceptor('getAttributeNode', IElementtPrototype);
const getAttributeNodeNS = new FunctionInterceptor('getAttributeNodeNS', IElementtPrototype);
const getBoundingClientRect = new FunctionInterceptor('getBoundingClientRect', IElementtPrototype);
const getClientRects = new FunctionInterceptor('getClientRects', IElementtPrototype);
const getElementsByClassName = new FunctionInterceptor('getElementsByClassName', IElementtPrototype);
const getElementsByTagName = new FunctionInterceptor('getElementsByTagName', IElementtPrototype);
const getElementsByTagNameNS = new FunctionInterceptor('getElementsByTagNameNS', IElementtPrototype);
const hasAttribute = new FunctionInterceptor('hasAttribute', IElementtPrototype);
const hasAttributeNS = new FunctionInterceptor('hasAttributeNS', IElementtPrototype);
const hasAttributes = new FunctionInterceptor('hasAttributes', IElementtPrototype);
const insertAdjacentElement = new FunctionInterceptor('insertAdjacentElement', IElementtPrototype);
const insertAdjacentHTML = new FunctionInterceptor('insertAdjacentHTML', IElementtPrototype);
const insertAdjacentText = new FunctionInterceptor('insertAdjacentText', IElementtPrototype);
const removeAttribute = new FunctionInterceptor('removeAttribute', IElementtPrototype);
const removeAttributeNS = new FunctionInterceptor('removeAttributeNS', IElementtPrototype);
const removeAttributeNode = new FunctionInterceptor('removeAttributeNode', IElementtPrototype);
const setAttribute = new FunctionInterceptor('setAttribute', IElementtPrototype);
const setAttributeNS = new FunctionInterceptor('setAttributeNS', IElementtPrototype);
const setAttributeNode = new FunctionInterceptor('setAttributeNode', IElementtPrototype);
const setAttributeNodeNS = new FunctionInterceptor('setAttributeNodeNS', IElementtPrototype);
const toggleAttribute = new FunctionInterceptor('toggleAttribute', IElementtPrototype);
const innerHTML = new AttributeInterceptor("innerHTML", IElementtPrototype);

const IElement = /*#__PURE__*/Object.freeze({
    __proto__: null,
    IElementtPrototype,
    getAttribute,
    getAttributeNS,
    getAttributeNames,
    getAttributeNode,
    getAttributeNodeNS,
    getBoundingClientRect,
    getClientRects,
    getElementsByClassName,
    getElementsByTagName,
    getElementsByTagNameNS,
    hasAttribute,
    hasAttributeNS,
    hasAttributes,
    insertAdjacentElement,
    insertAdjacentHTML,
    insertAdjacentText,
    removeAttribute,
    removeAttributeNS,
    removeAttributeNode,
    setAttribute,
    setAttributeNS,
    setAttributeNode,
    setAttributeNodeNS,
    toggleAttribute,
    innerHTML
});

const onDOMMutation = new Hook();
appendChild.onArgsObserverAdd(function (value) {
    onDOMMutation.call({
        action: "added",
        target: this,
        nodes: [value],
    });
});
insertBefore.onArgsObserverAdd(function (newNode, _referenceNode) {
    onDOMMutation.call({
        action: "added",
        target: this,
        nodes: [newNode],
    });
});
removeChild.onArgsObserverAdd(function (node) {
    onDOMMutation.call({
        action: "removed",
        target: this,
        nodes: [node],
    });
});
replaceChild.onArgsObserverAdd(function (newChild, oldChild) {
    onDOMMutation.call({
        action: "removed",
        target: this,
        nodes: [oldChild]
    });
    onDOMMutation.call({
        action: "added",
        target: this,
        nodes: [newChild]
    });
});
innerHTML.setter.onArgsObserverAdd(function (_value) {
    // Happens before actual call, so current children will be removed
    onDOMMutation.call({
        action: "removed",
        target: this,
        nodes: Array.from(this.childNodes),
    });
});
innerHTML.setter.onValueObserverAdd(function () {
    // Happens after actual call, so current children will are the ones added
    onDOMMutation.call({
        action: "added",
        target: this,
        nodes: Array.from(this.childNodes),
    });
});
insertAdjacentElement.onArgsObserverAdd(function (where, element) {
    const target = where === "afterbegin" || where === "beforeend" ? this : this.parentNode;
    if (target) {
        onDOMMutation.call({
            action: "added",
            target,
            nodes: [element]
        });
    }
});

const SyncMutationObserver = /*#__PURE__*/Object.freeze({
    __proto__: null,
    onDOMMutation
});

export { IElement, INode, SyncMutationObserver };
