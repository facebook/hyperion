/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */




// hyperionCore
export { getVirtualPropertyValue, setVirtualPropertyValue } from "@hyperion/hyperion-core/src/intercept";
export { interceptFunction } from "@hyperion/hyperion-core/src/FunctionInterceptor";
export { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
export { interceptConstructor, interceptConstructorMethod } from "@hyperion/hyperion-core/src/ConstructorInterceptor";
export * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";

// hyperionTrackElementsWithAttributes
export { trackElementsWithAttributes } from "@hyperion/hyperion-util/src/trackElementsWithAttributes";

// hyperionSyncMutationObserver
export * as SyncMutationObserver from "@hyperion/hyperion-util/src/SyncMutationObserver";

// hyperionOnNetworkRequest
export { onNetworkRequest } from "@hyperion/hyperion-util/src/onNetworkRequest";

// hyperionFlowletCore
export { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
export { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";

// hyperionFlowlet
export { initFlowletTrackers } from "@hyperion/hyperion-flowlet/src/Index";

// hyperionReact
export * as IRequire from "@hyperion/hyperion-react/src/IRequire";
export * as IReact from "@hyperion/hyperion-react/src/IReact";
export * as IReactDOM from "@hyperion/hyperion-react/src/IReactDOM";

// hyperionAutoLogging
export { Channel } from "@hyperion/hook/src/Channel";
export { ALFlowlet, ALFlowletManager } from "@hyperion/hyperion-autologging/src/ALFlowletManager";
export { useALSurfaceContext } from "@hyperion/hyperion-autologging/src/ALSurfaceContext";
export * as ALEventIndex from "@hyperion/hyperion-autologging/src/ALEventIndex";
export * as ALInteractableDOMElement from "@hyperion/hyperion-autologging/src/ALInteractableDOMElement";
export * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";