/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { interceptFunction } from "@hyperion/hyperion-core/src/intercept";
export function isEventListenerObject(func) {
    return typeof func === "object" && typeof func.handleEvent == "function";
}
export function interceptEventListener(listener) {
    let funcInterceptor;
    if (isEventListenerObject(listener)) {
        funcInterceptor = interceptFunction(listener.handleEvent);
        listener.handleEvent = funcInterceptor.interceptor;
    }
    else {
        funcInterceptor = interceptFunction(listener);
    }
    return funcInterceptor;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUV2ZW50TGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJRXZlbnRMaXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUdILE9BQU8sRUFBOEIsaUJBQWlCLEVBQUUsTUFBTSx1Q0FBdUMsQ0FBQztBQVd0RyxNQUFNLFVBQVUscUJBQXFCLENBQUMsSUFBa0I7SUFDdEQsT0FBTyxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsV0FBVyxJQUFJLFVBQVUsQ0FBQztBQUMzRSxDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUF5QixRQUFXO0lBQ3hFLElBQUksZUFBZSxDQUFDO0lBQ3BCLElBQUkscUJBQXFCLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbkMsZUFBZSxHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMxRCxRQUFRLENBQUMsV0FBVyxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUM7S0FDcEQ7U0FBTTtRQUNMLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMvQztJQUNELE9BQXdELGVBQWUsQ0FBQztBQUMxRSxDQUFDIn0=