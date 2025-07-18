/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * This file is auto generated from the Hyperion project hosted on
 * https://github.com/facebookincubator/hyperion
 * Instead of changing this file, you should:
 * - git clone https://github.com/facebookincubator/hyperion
 * - npm install
 * - npm run install-packages
 * - <make necessary modifications>
 * - npm run build
 * - npm test
 * - <copy the 'hyperion/dist/' folder>
 * - e.g. 'scp -r  ./dist/hyperion* $USER@my-od.facebook.com:www/html/js/hyperion/dist/'
 *
 * @generated <<SignedSource::378a2c8aba5a270f6cf75511cbaf450a>>
 */



import { interceptModuleExports, validateModuleInterceptor, interceptFunction, ShadowPrototype, interceptMethod, interceptConstructor } from '../hyperion-core';
import { Hook } from '../hyperion-hook';
import { TestAndSet } from '../hyperion-test-and-set';
import { assert } from '../hyperion-globals';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
let IJsxRuntimeModule = null;
let IReactModule = null;
function interceptRuntime(moduleId, moduleExports, failedExportsKeys) {
    if (!IJsxRuntimeModule) {
        IJsxRuntimeModule = interceptModuleExports(moduleId, moduleExports, ['jsx', 'jsxs', 'jsxDEV']);
        /**
         * https://github.com/facebook/react/blob/cae635054e17a6f107a39d328649137b83f25972/packages/react/src/jsx/ReactJSX.js#L19
         * The '.jsxs' is a special function that in development it points to a unique
         * function, but in production, it points to '.jsx'.
         * Hyperion does not reintercept the same function intentionally to ensure
         * developer is aware of how the hooks are intalled on the function.
         *
         * Therefore, we first call the interceptModuleExport without the failedExportsKeys which prevents validation
         * then we do the following patch up and then call the validation explicitly.
         */
        if (!__DEV__) {
            if (moduleExports.jsxs !== IJsxRuntimeModule.jsxs.interceptor) {
                moduleExports.jsxs = IJsxRuntimeModule.jsxs.interceptor;
            }
            if (moduleExports.jsxDEV !== IJsxRuntimeModule.jsxDEV.interceptor) {
                moduleExports.jsxDEV = IJsxRuntimeModule.jsxDEV.interceptor;
            }
        }
        validateModuleInterceptor(moduleId, moduleExports, IJsxRuntimeModule, failedExportsKeys);
    }
    return IJsxRuntimeModule;
}
function intercept$1(moduleId, moduleExports, failedExportsKeys) {
    if (!IReactModule) {
        IReactModule = interceptModuleExports(moduleId, moduleExports, [
            'createElement',
            'forwardRef',
            'useCallback',
            'useEffect',
            'useLayoutEffect',
            'useMemo',
            'useReducer',
            'useState'
        ], failedExportsKeys);
    }
    return IReactModule;
}

const IReact = /*#__PURE__*/Object.freeze({
    __proto__: null,
    intercept: intercept$1,
    interceptRuntime
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
let IReactDOMModule = null;
function intercept(moduleId, moduleExports, failedExportsKeys) {
    if (!IReactDOMModule) {
        IReactDOMModule = interceptModuleExports(moduleId, moduleExports, ['createPortal'], failedExportsKeys);
    }
    return IReactDOMModule;
}

const IReactDOM = /*#__PURE__*/Object.freeze({
    __proto__: null,
    intercept
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
const usePolyfill = typeof Symbol !== 'function' || !Symbol.for; // The Symbol used to tag the ReactElement-like types.
const SymbolFor = usePolyfill
    ? (symbolValue, _symbolName) => symbolValue
    : // eslint-disable-next-line fb-www/no-symbol
        (_symbolValue, symbolName) => Symbol.for(symbolName);
// export const REACT_ELEMENT_TYPE: Sym = ReactIs.Element;
// export const REACT_PORTAL_TYPE: Sym = ReactIs.Portal;
// export const REACT_FRAGMENT_TYPE: Sym = ReactIs.Fragment;
// export const REACT_STRICT_MODE_TYPE: Sym = ReactIs.StrictMode;
// export const REACT_PROFILER_TYPE: Sym = ReactIs.Profiler;
// export const REACT_PROVIDER_TYPE: Sym = ReactIs.ContextProvider;
// export const REACT_CONTEXT_TYPE: Sym = ReactIs.ContextConsumer;
// export const REACT_FORWARD_REF_TYPE: Sym = ReactIs.ForwardRef;
// export const REACT_SUSPENSE_LIST_TYPE: Sym = ReactIs.Suspense;
// export const REACT_MEMO_TYPE: Sym = ReactIs.Memo;
// export const REACT_LAZY_TYPE: Sym = ReactIs.Lazy;
const REACT_ELEMENT_TYPE = SymbolFor(0xeac7, 'react.element');
const REACT_PORTAL_TYPE = SymbolFor(0xeaca, 'react.portal');
const REACT_FRAGMENT_TYPE = SymbolFor(0xeacb, 'react.fragment');
const REACT_STRICT_MODE_TYPE = SymbolFor(0xeacc, 'react.strict_mode');
const REACT_PROFILER_TYPE = SymbolFor(0xead2, 'react.profiler');
const REACT_PROVIDER_TYPE = SymbolFor(0xeacd, 'react.provider');
const REACT_CONSUMER_TYPE = SymbolFor(0xeace, 'react.consumer'); // same as context
const REACT_CONTEXT_TYPE = SymbolFor(0xeace, 'react.context');
const REACT_FORWARD_REF_TYPE = SymbolFor(0xead0, 'react.forward_ref');
const REACT_SUSPENSE_LIST_TYPE = SymbolFor(0xead8, 'react.suspense_list');
const REACT_MEMO_TYPE = SymbolFor(0xead3, 'react.memo');
const REACT_SUSPENSE_TYPE = SymbolFor(0xead1, 'react.suspense');
const REACT_SCOPE_TYPE = SymbolFor(0xead7, 'react.scope');
const REACT_LEGACY_HIDDEN_TYPE = SymbolFor(0xeae3, 'react.legacy_hidden');

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
function warn(msg) {
    if (__DEV__) {
        console.warn(msg);
    }
}
function optimizeVisitors(visitors) {
    function callVtable(index, component, visitors) {
        const getter = vtable[index];
        if (getter) {
            return getter(component, visitors);
        }
        else {
            warn(`optimized visitors missing entry for ${String(index)}`);
        }
        return;
    }
    function ctor(visitorName) {
        if (visitorName != null && visitors[visitorName] != null) {
            // This visitor exists, so we can use it
            return (_, visitors) => visitors[visitorName];
        }
        else {
            // Use the __default visitor instead
            return (_, visitors) => visitors.__default;
        }
    }
    const vtable = {
        string: ctor('domElement'),
        function: ctor('component'),
        object: (component, visitors) => callVtable(component?.$$typeof, component, visitors),
        symbol: (component, visitors) => callVtable(component, component, visitors),
        [REACT_FORWARD_REF_TYPE]: ctor('forwardRef'),
        [REACT_MEMO_TYPE]: ctor('memo'),
        [REACT_PROVIDER_TYPE]: ctor('provider'),
        [REACT_CONSUMER_TYPE]: ctor('context'), // this is same as 'context'
        [REACT_CONTEXT_TYPE]: ctor('context'),
        [REACT_FRAGMENT_TYPE]: ctor('fragment'),
        [REACT_SUSPENSE_TYPE]: ctor(),
        [REACT_SUSPENSE_LIST_TYPE]: ctor(),
        [REACT_PROFILER_TYPE]: ctor(),
        [REACT_LEGACY_HIDDEN_TYPE]: ctor(),
        [REACT_SCOPE_TYPE]: ctor(),
        [REACT_STRICT_MODE_TYPE]: ctor(),
    };
    visitors._get = (component, visitors) => callVtable(typeof component, component, visitors);
}
let ReactModule = null;
function init$1(options) {
    ReactModule = options.ReactModule;
}
function getVisitor(component, visitors) {
    const optVisitor = visitors._get?.(component, visitors);
    if (optVisitor || !visitors.__default) {
        // either we found something, or there was no default.
        return optVisitor;
    }
    // Otherwise, let's try the old way!
    let visitor;
    switch (typeof component) {
        case 'string':
            visitor = visitors.domElement;
            break;
        case 'function':
            visitor = visitors.component;
            break;
        case 'object':
            {
                if (!component) {
                    break;
                }
                /**
                 * This is a component object, e.g. from createForwardRef(...)
                 * React still process it as if it was a functional component
                 */
                const specialComp =
                // $FlowIgnore[incompatible-type] // https://fb.workplace.com/groups/flow/permalink/9565274296854433/
                component;
                switch (specialComp.$$typeof) {
                    case REACT_FORWARD_REF_TYPE:
                        visitor = visitors.forwardRef;
                        break;
                    case REACT_MEMO_TYPE:
                        visitor = visitors.memo;
                        break;
                    case REACT_PROVIDER_TYPE:
                        visitor = visitors.provider;
                        break;
                    case REACT_CONSUMER_TYPE:
                    case REACT_CONTEXT_TYPE:
                        visitor = visitors.context;
                        break;
                    default:
                        warn(`skip object component $$type: ${String(specialComp.$$typeof)}`);
                        break;
                }
            }
            break;
        case 'symbol':
            switch (component) {
                case REACT_FRAGMENT_TYPE:
                    /**
                     * do we need to recurse inside? probably not, each child itself should
                     * be called by the jsx* api
                     */
                    visitor = visitors.fragment;
                    break;
                case REACT_SUSPENSE_TYPE:
                    /**
                     * props is {fallback, suspenseCallback}
                     * probably need to interncep those
                     */
                    break;
                case REACT_PROFILER_TYPE:
                    break;
                case REACT_LEGACY_HIDDEN_TYPE:
                    /**
                     * props is {children, ...}
                     * assumption is those are already processed before
                     */
                    break;
                case REACT_SCOPE_TYPE:
                    break;
                case REACT_STRICT_MODE_TYPE:
                    break;
                default:
                    warn(`skip special component $$type: ${String(component)}`);
                    break;
            }
            break;
        default: {
            warn(`Did not know how to handle component type ${typeof component}`);
        }
    }
    visitor = visitor ?? visitors.__default;
    return visitor;
}
function visitElement(component, props, param, visitors, node) {
    const visitor = getVisitor(component, visitors);
    // @ts-ignore
    return visitor?.(
    // @ts-ignore
    component, props, param, node);
}
function createReactElementVisitor(visitors) {
    optimizeVisitors(visitors);
    return (component, props, param) => visitElement(component, props, param, visitors);
}
function visitNode(node, param, visitors) {
    if (typeof node !== 'object' ||
        node == null ||
        node instanceof Node // See this: https://fb.workplace.com/groups/reactjs/permalink/9019994061382462/
    ) {
        return;
    }
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; ++i) {
            visitNode(node[i], param, visitors);
        }
    }
    else {
        // @ts-ignore
        const element = node;
        const $$typeof = element.$$typeof;
        switch ($$typeof) {
            case REACT_ELEMENT_TYPE:
            case REACT_FORWARD_REF_TYPE: {
                const props = element.props;
                if (!props || typeof props !== 'object') {
                    return;
                }
                return visitElement(element.type, props, param, visitors, element);
            }
            case REACT_PORTAL_TYPE:
                // return visitNode(node.children, param, visitors);
                return;
            case REACT_MEMO_TYPE:
            case REACT_PROVIDER_TYPE:
                // These component won't have children so safe to skip
                if (__DEV__) {
                    if (typeof element.props === 'object') {
                        warn(`Unexpected object props type when skiping: ${String($$typeof)}`);
                    }
                }
                return;
            default: {
                /**
                 * We have tried every known option so far, now we can try the builtin
                 * React mechanism to visit the node.
                 * the React.Children.forEach is expensive and creates extra array objects
                 * during iteration. Therefore, we should regularly try to minimize the
                 * reliance on this code.
                 */
                let visited = false;
                try {
                    ReactModule?.Children.forEach(node, child => {
                        visited = true;
                        visitNode(child, param, visitors);
                    });
                }
                catch (e) {
                    // FBLogger('ads_manager_auto_logging')
                    //   .catching(e)
                    //   .mustfix('Error during visiting children of react element');
                }
                if (!visited) {
                    warn(`Unexpected child component type to skip: ${String($$typeof)}`);
                }
                break;
            }
        }
    }
    return;
}
function createReactNodeVisitor(visitors) {
    const visitor = (node, param) => visitNode(node, param, visitors);
    if (!visitors.fragment) {
        visitors.fragment = (_comp, props, param, _node) => visitor(props.children, param);
    }
    optimizeVisitors(visitors);
    return visitor;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
class ReactClassComponentShadowPrototype extends ShadowPrototype {
    name;
    ctor;
    render = interceptMethod('render', this);
    componentWillMount = interceptMethod('componentWillMount', this);
    componentDidMount = interceptMethod('componentDidMount', this);
    componentWillReceiveProps = interceptMethod('componentWillReceiveProps', this);
    shouldComponentUpdate = interceptMethod('shouldComponentUpdate', this);
    componentWillUpdate = interceptMethod('componentWillUpdate', this);
    componentDidUpdate = interceptMethod('componentDidUpdate', this);
    componentWillUnmount = interceptMethod('componentWillUnmount', this);
    componentDidCatch = interceptMethod('componentDidCatch', this);
    setState = interceptMethod('setState', this);
    constructor(component, classComponentParentClass) {
        if (__DEV__) {
            const classComponentParentClass1 = component.prototype;
            assert(classComponentParentClass === classComponentParentClass1, 'Unexpected setup');
        }
        super(classComponentParentClass, null);
        this.name = component.displayName ?? component.name;
        this.ctor = interceptConstructor(component);
    }
}
const onReactClassComponentIntercept = new Hook();
const onReactFunctionComponentIntercept = new Hook();
const onReactDOMElement = new Hook();
const onReactClassComponentElement = new Hook();
const onReactFunctionComponentElement = new Hook();
const onReactSpecialObjectElement = new Hook();
const initialized = new TestAndSet();
function init(options) {
    if (initialized.testAndSet()) {
        return;
    }
    const { ReactModule, IReactModule, IJsxRuntimeModule } = options;
    init$1(options);
    const interceptionInfo = new Map();
    function processReactClassComponent(component, classComponentParentClass) {
        if (!options.enableInterceptClassComponentMethods && !options.enableInterceptClassComponentConstructor) {
            return component;
        }
        // For class components, we just need to intercept them once
        if (interceptionInfo.has(component)) {
            return component;
        }
        interceptionInfo.set(component, null);
        let info = interceptionInfo.get(classComponentParentClass);
        if (!info) {
            info = new ReactClassComponentShadowPrototype(component, classComponentParentClass);
            interceptionInfo.set(classComponentParentClass, info);
            onReactClassComponentIntercept.call(info);
        }
        return options.enableInterceptClassComponentConstructor ? info.ctor.interceptor : component;
    }
    function processReactFunctionComponent(functionComponent) {
        if (!options.enableInterceptFunctionComponentRender) {
            return functionComponent;
        }
        /**
         * For functional components, we should always replace them with the
         * intercepted version of them.
         * however, the interceptFunction itself will only assign a FunctionIntercetpr
         * to the function once.
         * So, we don't need to use the interceptionInfo map here.
         */
        const fi = interceptFunction(functionComponent, false, null, (functionComponent.displayName ?? functionComponent.name) || void 0);
        onReactFunctionComponentIntercept.call(fi);
        return fi.interceptor;
    }
    const processComponent = createReactElementVisitor({
        domElement: options.enableInterceptDomElement
            ? (component, props) => {
                onReactDOMElement.call(component, props);
            }
            : void 0,
        component: options.enableInterceptComponentElement
            || options.enableInterceptFunctionComponentRender
            || options.enableInterceptClassComponentMethods
            || options.enableInterceptClassComponentConstructor
            ? (component, props) => {
                let interceptedComponent = component;
                /**
                 * This is a react component, and can be a class component constructor
                 * or functional component.
                 *
                 * Note that react itself has no types, and flow compiler has some built-in
                 * hard coded types just to be able to handle react types.
                 * (see all the React$* types in react.js)
                 * So, sadly the code bellow effectively cannot rely on types much.
                 *
                 * We need to check for two conditions:
                 * 1- the component is a class constructor and it inherits from ReactModule.Component
                 *    or something that has a .render() function.
                 * 2- the component is a normal function, i.e. the .prototype is a plain object with just one .constructor in it.
                   *  That means the __proto__ of this object is an empty object (i.e. the __proto__ of that object is null)
                   *  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/prototype#:~:text=prototype%20property%2C%20by%20default
                 */
                const classComponentParentClass = component.prototype;
                let classComponentParentClassParent;
                if (classComponentParentClass && (classComponentParentClass instanceof ReactModule.Component ||
                    typeof classComponentParentClass.render === 'function' || // possibly created via React.createClass
                    ((classComponentParentClassParent = Object.getPrototypeOf(classComponentParentClass)) &&
                        Object.getPrototypeOf(classComponentParentClassParent)) || // not a plain function, may be with some other lifecycle methods.
                    classComponentParentClass === ReactModule.Component.prototype // in case buggy code didn't properly inherit from ReactModule.Component
                )) {
                    // @ts-ignore
                    const classComponent = component;
                    interceptedComponent = processReactClassComponent(classComponent, classComponentParentClass);
                    onReactClassComponentElement.call(classComponent, props);
                }
                else {
                    // @ts-ignore
                    const functionalComponent = component;
                    interceptedComponent =
                        processReactFunctionComponent(functionalComponent);
                    onReactFunctionComponentElement.call(functionalComponent, props);
                }
                return interceptedComponent;
            }
            : void 0,
        forwardRef: options.enableInterceptSpecialElement
            ? (component, props) => {
                if (component.render && typeof component.render === 'function') {
                    // $FlowIgnore[incompatible-type] // https://fb.workplace.com/groups/flow/permalink/9565274296854433/
                    // @ts-ignore
                    component.render = processReactFunctionComponent(component.render);
                }
                onReactSpecialObjectElement.call(component, props);
            }
            : void 0,
        memo: options.enableInterceptSpecialElement
            ? (component, _props) => {
                if (typeof component.type === 'object') {
                    const comp = component.type;
                    if (comp.render && typeof comp.render === 'function') {
                        // $FlowIgnore[incompatible-type] // https://fb.workplace.com/groups/flow/permalink/9565274296854433/
                        // @ts-ignore
                        comp.render = processReactFunctionComponent(comp.render);
                    }
                }
            }
            : void 0,
        provider: options.enableInterceptSpecialElement
            ? (component, props) => {
                onReactSpecialObjectElement.call(component, props);
            }
            : void 0,
        context: options.enableInterceptSpecialElement
            ? (component, props) => {
                onReactSpecialObjectElement.call(component, props);
            }
            : void 0,
    });
    function interceptArgs(component, props) {
        // $FlowIgnore[incompatible-return]
        // @ts-ignore
        return processComponent(component, props) ?? component;
    }
    const interceptArgsFunc = /* AdsALProfiler
      ? (
        component: ReactComponentType<PropsType>,
        props: PropsType,
      ): ReactComponentType<PropsType> => {
        const timer = AdsALProfiler.getALProfiler()?.timers.interceptArgs;
        timer?.start();
        const result = interceptArgs(component, props);
        timer?.stop();
        return result;
      }
      : */ interceptArgs;
    const handler = IJsxRuntimeModule.jsx.onBeforeCallMapperAdd(args => {
        /**
         * TODO: T132536682 remove this guard later to speed things up
         * NOTE: tried using ErrorGuard.guard, and ErrorGuard.applyWithGuard but
         * as usual, Flow cannot handle complex function input/ouput types.
         * So, putting the raw try/catch, which is the actual implementation of
         * ErrorGaurd.applyWithGuard anyways.
         *
         * The rest of the logic in this module and ALSurface all run under this
         * function, so this should catch all possible errors.
         */
        try {
            const type = interceptArgsFunc(args[0], args[1]);
            args[0] = type;
        }
        catch (e) {
            // FBLogger('ads_manager_auto_logging')
            //   .catching(e)
            //   .mustfix('Error during React args interception: %s', e.message);
        }
        return args;
    });
    if (IJsxRuntimeModule.jsxs !== IJsxRuntimeModule.jsx) {
        IJsxRuntimeModule.jsxs.onBeforeCallMapperAdd(handler);
    }
    IJsxRuntimeModule.jsxDEV.onBeforeCallMapperAdd(handler);
    IReactModule.createElement.onBeforeCallMapperAdd(handler);
}

const IReactComponent = /*#__PURE__*/Object.freeze({
    __proto__: null,
    init,
    onReactClassComponentElement,
    onReactClassComponentIntercept,
    onReactDOMElement,
    onReactFunctionComponentElement,
    onReactFunctionComponentIntercept,
    onReactSpecialObjectElement
});

export { IReact, IReactComponent, IReactDOM, createReactNodeVisitor, init, onReactClassComponentIntercept, onReactDOMElement, onReactFunctionComponentIntercept };
