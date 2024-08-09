/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

// hyperionAsyncCounter
export { AsyncCounter } from "@hyperion/hyperion-async-counter/src/AsyncCounter";

// hyperionHook
export { Hook } from "@hyperion/hyperion-hook/src/Hook";

// hyperionChannel
export { PipeableEmitter, Channel, PausableChannel } from "@hyperion/hyperion-channel/src/Channel";

// hyperionTimedTrigger
export { TimedTrigger } from "@hyperion/hyperion-timed-trigger/src/TimedTrigger";

// hyperionTestAndSet
export { default as TestAndSet } from "@hyperion/hyperion-test-and-set/src/TestAndSet";

// hyperionCore
export { setAssertLoggerOptions } from "@hyperion/hyperion-global/src/assert";
export { intercept, getVirtualPropertyValue, setVirtualPropertyValue, getOwnShadowPrototypeOf, registerShadowPrototype } from "@hyperion/hyperion-core/src/intercept";
export { interceptFunction, getFunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
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
export * as IHTMLInputElement from "@hyperion/hyperion-dom/src/IHTMLInputElement";
export * as ICSSStyleDeclaration from "@hyperion/hyperion-dom/src/ICSSStyleDeclaration";
// export * as IGlobalEventHandlers from "@hyperion/hyperion-dom/src/IGlobalEventHandlers";
export * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
// export * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";

// hyperionTrackElementsWithAttributes
export { trackElementsWithAttributes } from "@hyperion/hyperion-util/src/trackElementsWithAttributes";

// hyperionSyncMutationObserver
export * as SyncMutationObserver from "@hyperion/hyperion-util/src/SyncMutationObserver";

// hyperionUtil
export { ClientSessionID } from "@hyperion/hyperion-util/src/ClientSessionID";
export { SessionPersistentData, LocalStoragePersistentData, CookiePersistentData, CookieStorage } from "@hyperion/hyperion-util/src/PersistentData";

// hyperionFlowletCore
export { Flowlet, onFlowletInit } from "@hyperion/hyperion-flowlet/src/Flowlet";
export { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
export { getTriggerFlowlet, setTriggerFlowlet } from "@hyperion/hyperion-flowlet/src/TriggerFlowlet";

// hyperionFlowlet
export { initFlowletTrackers } from "@hyperion/hyperion-flowlet/src/FlowletWrappers";

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
export * as ALCustomEvent from '@hyperion/hyperion-autologging/src/ALCustomEvent';
export { getCurrentUIEventData } from "@hyperion/hyperion-autologging/src/ALUIEventPublisher";
export * as ALEventExtension from "@hyperion/hyperion-autologging/src/ALEventExtension";
export { getSessionFlowID, getDomainSessionID } from "@hyperion/hyperion-autologging/src/ALSessionFlowID";

// hyperionAutoLoggingVisualizer
export * as ALGraph from "@hyperion/hyperion-autologging-visualizer/src/component/ALGraph";
export { ALGraphInfo } from "@hyperion/hyperion-autologging-visualizer/src/component/ALGraphInfo.react";
