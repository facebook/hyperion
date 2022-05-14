/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { EventHandlerAttributeInterceptor } from "./EventHandlerAttributeInterceptor";
import { IEventTargetPrototype } from "./IEventTarget";
/**
 * In jest environment Worker is not defined. The following will allow tests to run
 * while actually keeping the feature enabled for browsers.
 */
const WorkerClass = window.Worker ?? { prototype: IEventTargetPrototype.targetPrototype, };
export const IWorkerPrototype = new DOMShadowPrototype(WorkerClass, IEventTargetPrototype, { registerOnPrototype: true });
export const onmessage = new EventHandlerAttributeInterceptor("onmessage", IWorkerPrototype);
export const onmessageerror = new EventHandlerAttributeInterceptor("onmessageerror", IWorkerPrototype);
export const onerror = new EventHandlerAttributeInterceptor("onerror", IWorkerPrototype);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSVdvcmtlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIklXb3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFFSCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMxRCxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUN0RixPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUV2RDs7O0dBR0c7QUFDSCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLEVBQUUsU0FBUyxFQUFtQixxQkFBcUIsQ0FBQyxlQUFlLEdBQUcsQ0FBQTtBQUMzRyxNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGtCQUFrQixDQUFzQixXQUFXLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBRS9JLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyxJQUFJLGdDQUFnQyxDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzdGLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRyxJQUFJLGdDQUFnQyxDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDdkcsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHLElBQUksZ0NBQWdDLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUMifQ==