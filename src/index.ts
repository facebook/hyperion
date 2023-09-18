/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

// hyperionHook
export { Hook } from "@hyperion/hook/src/Hook";
export { PipeableEmitter, Channel } from "@hyperion/hook/src/Channel";

// hyperionCore
export { setAssertLoggerOptions } from "@hyperion/global/src/assert";
export { getVirtualPropertyValue, setVirtualPropertyValue } from "@hyperion/hyperion-core/src/intercept";
export { interceptFunction } from "@hyperion/hyperion-core/src/FunctionInterceptor";
export { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
export { interceptConstructor, interceptConstructorMethod } from "@hyperion/hyperion-core/src/ConstructorInterceptor";
export * as IRequire from "@hyperion/hyperion-core/src/IRequire";
export * as IPromise from "@hyperion/hyperion-core/src/IPromise";
export * as IGlobalThis from "@hyperion/hyperion-core/src/IGlobalThis";

// hyperionDOM
export * as IEvent from "@hyperion/hyperion-dom/src/IEvent";
export * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
// export * as INode from "@hyperion/hyperion-dom/src/INode";
export * as IElement from "@hyperion/hyperion-dom/src/IElement";
export * as IHTMLElement from "@hyperion/hyperion-dom/src/IHTMLElement";
export * as ICSSStyleDeclaration from "@hyperion/hyperion-dom/src/ICSSStyleDeclaration";
// export * as IGlobalEventHandlers from "@hyperion/hyperion-dom/src/IGlobalEventHandlers";
// export * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
// export * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";

// hyperionTrackElementsWithAttributes
export { trackElementsWithAttributes } from "@hyperion/hyperion-util/src/trackElementsWithAttributes";

// hyperionSyncMutationObserver
export * as SyncMutationObserver from "@hyperion/hyperion-util/src/SyncMutationObserver";

// hyperionUtil
export { ClientSessionID } from "@hyperion/hyperion-util/src/ClientSessionID";
export { SessionPersistentData } from "@hyperion/hyperion-util/src/SessionPersistentData";
export { default as TestAndSet } from "@hyperion/hyperion-util/src/TestAndSet";
export { TimedTrigger } from "@hyperion/hyperion-util/src/TimedTrigger";

// hyperionFlowletCore
export { Flowlet, onFlowletInit } from "@hyperion/hyperion-flowlet/src/Flowlet";
export { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";

// hyperionFlowlet
export { initFlowletTrackers } from "@hyperion/hyperion-flowlet/src/Index";

// hyperionReact
export * as IReact from "@hyperion/hyperion-react/src/IReact";
export * as IReactDOM from "@hyperion/hyperion-react/src/IReactDOM";
export * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent"

// hyperionAutoLogging
export { ALFlowlet, ALFlowletManager } from "@hyperion/hyperion-autologging/src/ALFlowletManager";
export { useALSurfaceContext } from "@hyperion/hyperion-autologging/src/ALSurfaceContext";
export * as ALEventIndex from "@hyperion/hyperion-autologging/src/ALEventIndex";
export { default as ALElementInfo } from "@hyperion/hyperion-autologging/src/ALElementInfo";
export * as ALInteractableDOMElement from "@hyperion/hyperion-autologging/src/ALInteractableDOMElement";
export * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";
export { ALSurfaceCapability } from "@hyperion/hyperion-autologging/src/ALSurface";
export * as ALSurfaceUtils from "@hyperion/hyperion-autologging/src/ALSurfaceUtils";
