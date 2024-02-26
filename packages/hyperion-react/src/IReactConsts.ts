/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

/**
 * The following is copied from the React source code since they are not directly
 * exposed from the module and these are constants that we sometimes need to
 * better evaluate the react components
 * Latest: https://github.com/facebook/react/blob/main/packages/shared/ReactSymbols.js
 * Release: https://github.com/facebook/react/blob/cae635054e17a6f107a39d328649137b83f25972/fixtures/legacy-jsx-runtimes/react-17/cjs/react-jsx-dev-runtime.development.js
 */
// import * as ReactIs from "react-is";

type Sym = symbol | number;
const usePolyfill = typeof Symbol !== 'function' || !Symbol.for; // The Symbol used to tag the ReactElement-like types.
const SymbolFor: (symbolValue: number, symbolName: string) => Sym = usePolyfill
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

export const REACT_ELEMENT_TYPE: Sym = SymbolFor(0xeac7, 'react.element');
export const REACT_PORTAL_TYPE: Sym = SymbolFor(0xeaca, 'react.portal');
export const REACT_FRAGMENT_TYPE: Sym = SymbolFor(0xeacb, 'react.fragment');
export const REACT_STRICT_MODE_TYPE: Sym = SymbolFor(0xeacc, 'react.strict_mode');
export const REACT_PROFILER_TYPE: Sym = SymbolFor(0xead2, 'react.profiler');
export const REACT_PROVIDER_TYPE: Sym = SymbolFor(0xeacd, 'react.provider');
export const REACT_CONSUMER_TYPE: Sym = SymbolFor(0xeace, 'react.consumer'); // same as context
export const REACT_CONTEXT_TYPE: Sym = SymbolFor(0xeace, 'react.context');
export const REACT_FORWARD_REF_TYPE: Sym = SymbolFor(0xead0, 'react.forward_ref');
export const REACT_SUSPENSE_LIST_TYPE: Sym = SymbolFor(0xead8, 'react.suspense_list');
export const REACT_MEMO_TYPE: Sym = SymbolFor(0xead3, 'react.memo');
export const REACT_LAZY_TYPE: Sym = SymbolFor(0xead4, 'react.lazy');

export const REACT_SERVER_CONTEXT_TYPE: Sym = SymbolFor(0xeae6, 'react.server_context');
export const REACT_SUSPENSE_TYPE: Sym = SymbolFor(0xead1, 'react.suspense');
export const REACT_SCOPE_TYPE: Sym = SymbolFor(0xead7, 'react.scope');
export const REACT_DEBUG_TRACING_MODE_TYPE: Sym = SymbolFor(0xeae1, 'react.debug_trace_mode',);
export const REACT_OFFSCREEN_TYPE: Sym = SymbolFor(0xeae2, 'react.offscreen');
export const REACT_LEGACY_HIDDEN_TYPE: Sym = SymbolFor(0xeae3, 'react.legacy_hidden',);
export const REACT_CACHE_TYPE: Sym = SymbolFor(0xeae4, 'react.cache');
export const REACT_TRACING_MARKER_TYPE: Sym = SymbolFor(0xeae5, 'react.tracing_marker',);
export const REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED: Sym = SymbolFor(0xeae7, 'react.default_value',);
export const FAUX_ITERATOR_SYMBOL = '@@iterator';
