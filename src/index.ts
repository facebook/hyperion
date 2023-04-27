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
export * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
export * as IRequire from "@hyperion/hyperion-core/src/IRequire";

// hyperionTrackElementsWithAttributes
export { trackElementsWithAttributes } from "@hyperion/hyperion-util/src/trackElementsWithAttributes";

// hyperionSyncMutationObserver
export * as SyncMutationObserver from "@hyperion/hyperion-util/src/SyncMutationObserver";

// hyperionUtil
export { TimedTrigger } from "@hyperion/hyperion-util/src/TimedTrigger";
export { SessionPersistentData } from "@hyperion/hyperion-util/src/SessionPersistentData";
export { ClientSessionID } from "@hyperion/hyperion-util/src/ClientSessionID";

// hyperionFlowletCore
export { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
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