"use strict";(self.webpackChunk_hyperion_hyperion_docs=self.webpackChunk_hyperion_hyperion_docs||[]).push([[9892],{7314:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>c,default:()=>d,frontMatter:()=>i,metadata:()=>r,toc:()=>l});const r=JSON.parse('{"id":"packages/hyperion-core/FunctionInterceptor","title":"Function Interceptor","description":"FunctionInterceptor is at the heart of hyperion-core and creates","source":"@site/docs/packages/hyperion-core/FunctionInterceptor.md","sourceDirName":"packages/hyperion-core","slug":"/packages/hyperion-core/FunctionInterceptor","permalink":"/docs/packages/hyperion-core/FunctionInterceptor","draft":false,"unlisted":false,"editUrl":"https://github.com/facebookincubator/hyperion/tree/gh-pages/docs/packages/hyperion-core/FunctionInterceptor.md","tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_position":2},"sidebar":"tutorialSidebar","previous":{"title":"intro","permalink":"/docs/packages/hyperion-core/intro"},"next":{"title":"Builtin JS interceptors","permalink":"/docs/packages/hyperion-core/BuiltInInterceptors"}}');var o=n(1085),a=n(1184);const i={sidebar_position:2},c="Function Interceptor",s={},l=[{value:"argument observers and mappers",id:"argument-observers-and-mappers",level:2},{value:"return value observers and mappers",id:"return-value-observers-and-mappers",level:2},{value:"argument + return value mapper",id:"argument--return-value-mapper",level:2},{value:"extra data on the interceptor object",id:"extra-data-on-the-interceptor-object",level:2},{value:"Builtin JS interceptors",id:"builtin-js-interceptors",level:2}];function h(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",strong:"strong",ul:"ul",...(0,a.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.header,{children:(0,o.jsx)(t.h1,{id:"function-interceptor",children:"Function Interceptor"})}),"\n",(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.a,{href:"https://github.com/facebook/hyperion/blob/main/packages/hyperion-core/src/FunctionInterceptor.ts",children:(0,o.jsx)(t.code,{children:"FunctionInterceptor<FuncType>"})})," is at the heart of ",(0,o.jsx)(t.a,{href:"/docs/packages/hyperion-core/intro",children:"hyperion-core"})," and creates\r\na high performance wrapper around a given function and provides following important functionality:"]}),"\n",(0,o.jsxs)(t.ul,{children:["\n",(0,o.jsx)(t.li,{children:"observers that can observe function arguments or function return value"}),"\n",(0,o.jsx)(t.li,{children:"mappers that allow callbacks to modify arguments of the function before it is called, or return value of the function after it is called."}),"\n",(0,o.jsx)(t.li,{children:"mechanism to prevent execution of the function"}),"\n"]}),"\n",(0,o.jsxs)(t.p,{children:["The type argument of the ",(0,o.jsx)(t.code,{children:"FunctionInterceptor<FuncType>"})," determines the signature of the\r\nfunction that is intercepted. The signature of callbacks for the following api is computed\r\nbased on this given type argument and hence all api provide a fully typed experience."]}),"\n",(0,o.jsx)(t.p,{children:"The following are main API of this class:"}),"\n",(0,o.jsx)(t.h2,{id:"argument-observers-and-mappers",children:"argument observers and mappers"}),"\n",(0,o.jsxs)(t.p,{children:["The ",(0,o.jsx)(t.code,{children:"onBeforeCallObserverAdd(callback)"})," method allows installing argument observer.\r\nThe callback will be called before the original function is called. This callback\r\ncan observe the value of the arguments, but cannot change them. The signature of this callback\r\nwill be exactly the same as the original function, but it can return a ",(0,o.jsx)(t.code,{children:"boolean"})," value.\r\nIf any such callback returns ",(0,o.jsx)(t.code,{children:"true"}),", then the original function won't be called; which is useful to implement security features or provide alternative implementations for the function."]}),"\n",(0,o.jsxs)(t.p,{children:["The ",(0,o.jsx)(t.code,{children:"onBeforeCallMapperAdd(callback)"})," method allows installing an argument mapper.\r\nThe callback will be called before the original function is called. This callback\r\nrecieves an array (similar to JavaScript ",(0,o.jsx)(t.code,{children:"arguments"})," object) and can modify and return\r\na new argument array with new values of the arguments.\r\nThis callback is more expensive than the observer variant and should be used with care."]}),"\n",(0,o.jsx)(t.p,{children:"If multiple mappers are installed, the output of each callback is passed to the next one as input."}),"\n",(0,o.jsxs)(t.p,{children:["See ",(0,o.jsx)(t.a,{href:"https://github.com/facebook/hyperion/blob/main/packages/hyperion-core/test/FunctionInterceptor.test.ts",children:"FunctionInterceptor.test.ts"})," for example code."]}),"\n",(0,o.jsx)(t.h2,{id:"return-value-observers-and-mappers",children:"return value observers and mappers"}),"\n",(0,o.jsxs)(t.p,{children:["The ",(0,o.jsx)(t.code,{children:"onAfterCallObserverAdd(callback)"})," method allows installing return value observer.\r\nThe callback recieves a value of the type of the original function return value and return void. This function is called original function is called."]}),"\n",(0,o.jsxs)(t.p,{children:["The ",(0,o.jsx)(t.code,{children:"onAfterCallMapperAdd(callback)"})," also allows the callback to change the return value of the function to something of ",(0,o.jsx)(t.strong,{children:"the same type"}),"."]}),"\n",(0,o.jsx)(t.p,{children:"If multiple mappers are installed, the output of each callback is passed to the next one as input."}),"\n",(0,o.jsxs)(t.p,{children:["See ",(0,o.jsx)(t.a,{href:"https://github.com/facebook/hyperion/blob/main/packages/hyperion-core/test/FunctionInterceptor.test.ts",children:"FunctionInterceptor.test.ts"})," for example code."]}),"\n",(0,o.jsx)(t.h2,{id:"argument--return-value-mapper",children:"argument + return value mapper"}),"\n",(0,o.jsx)(t.p,{children:"Sometimes we might need to know the input arguments to make a modification to the return value.\r\nOr we might need to create intermediary values based on input argument before the function call\r\nand then use that value after the function call to process the output.\r\nWe might even simply want to run to pieces of related code before and after a function (e.g. start time and end time of a function to measure its latency)"}),"\n",(0,o.jsxs)(t.p,{children:["To make such cases easier, the ",(0,o.jsx)(t.code,{children:"onBeforeAndAfterCallMapperAdd(callback)"})," method allows\r\na callback to receive arguments of the function in an array (which it can update) and return\r\na function that will be used to observe or map the return value of the function."]}),"\n",(0,o.jsx)(t.p,{children:"Note that this function is the most expensive form of interception and should be used only\r\nwhen really necessary."}),"\n",(0,o.jsxs)(t.p,{children:["See ",(0,o.jsx)(t.a,{href:"https://github.com/facebook/hyperion/blob/main/packages/hyperion-core/test/FunctionInterceptor.test.ts",children:"FunctionInterceptor.test.ts"})," for example code."]}),"\n",(0,o.jsx)(t.h2,{id:"extra-data-on-the-interceptor-object",children:"extra data on the interceptor object"}),"\n",(0,o.jsxs)(t.p,{children:["The ",(0,o.jsx)(t.code,{children:"FunctionInterceptor"})," class creates an interceptor object which can also carry\r\nextra data. the ",(0,o.jsx)(t.code,{children:"setData<T>(dataPropName: string, value: T): void"})," and ",(0,o.jsx)(t.code,{children:"getData<T>(dataPropName: string): T | undefined"})," methods allow named properties to be added to this object."]}),"\n",(0,o.jsxs)(t.p,{children:["A very common usecase to track if certain type of callback is added to an interceptor. While one can implement such functionality using combination of ",(0,o.jsx)(t.code,{children:"getData"})," and ",(0,o.jsx)(t.code,{children:"setData"}),", the helper ",(0,o.jsx)(t.code,{children:"testAndSet(dataPropName: string): boolean"})," method provide this functionality out of the box."]}),"\n",(0,o.jsxs)(t.p,{children:["All of the above methods have a corresponding ",(0,o.jsx)(t.code,{children:"...Remove"})," counterpart that allow removing\r\na callback at any time. This is particularly useful at runtime if an observer has found the\r\nsituation it was looking for and can remove the callback to reduce the performace overhead it adds."]}),"\n",(0,o.jsx)(t.h2,{id:"builtin-js-interceptors",children:"Builtin JS interceptors"}),"\n",(0,o.jsxs)(t.p,{children:["The ",(0,o.jsx)(t.code,{children:"hyperion-core"})," package already contains ready main interceptors for the following JS objects"]}),"\n",(0,o.jsxs)(t.ul,{children:["\n",(0,o.jsx)(t.li,{children:"IGlobalThis provides interceptors for global methods such as (setTimeout, setInterval)"}),"\n",(0,o.jsxs)(t.li,{children:["IPromise provies interceptos for all ",(0,o.jsx)(t.code,{children:"Promise"})," methods and constructors"]}),"\n",(0,o.jsxs)(t.li,{children:["IRequre provide interceptors for typical implementations of js ",(0,o.jsx)(t.code,{children:"require"})," funcationality which can be used to investigate modules and bootstrap further interception of their output."]}),"\n"]})]})}function d(e={}){const{wrapper:t}={...(0,a.R)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(h,{...e})}):h(e)}},1184:(e,t,n)=>{n.d(t,{R:()=>i,x:()=>c});var r=n(4041);const o={},a=r.createContext(o);function i(e){const t=r.useContext(a);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:i(e.components),r.createElement(a.Provider,{value:t},e.children)}}}]);