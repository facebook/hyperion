/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */


export { getVirtualPropertyValue, setVirtualPropertyValue } from "@hyperion/hyperion-core/src/intercept";
export { interceptFunction } from "@hyperion/hyperion-core/src/FunctionInterceptor";
export { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
export { interceptConstructor, interceptConstructorMethod } from "@hyperion/hyperion-core/src/ConstructorInterceptor";

export { trackElementsWithAttributes } from "@hyperion/hyperion-util/src/trackElementsWithAttributes";

export * as SyncMutationObserver from "@hyperion/hyperion-util/src/SyncMutationObserver";

export { onNetworkRequest } from "@hyperion/hyperion-util/src/onNetworkRequest";

export { initFlowletTrackers } from "@hyperion/hyperion-flowlet/src/Index";
export { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
export { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";