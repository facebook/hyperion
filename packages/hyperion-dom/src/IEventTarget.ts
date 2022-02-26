import { DOMShadowPrototype, sampleHTMLElement } from "./DomShadowPrototype";
import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor"

export const IEventTargetPrototype = new DOMShadowPrototype(EventTarget, null, { sampleObject: sampleHTMLElement });

export const addEventListener = new FunctionInterceptor('addEventListener', IEventTargetPrototype);
export const dispatchEvent = new FunctionInterceptor('dispatchEvent', IEventTargetPrototype);
export const removeEventListener = new FunctionInterceptor('removeEventListener', IEventTargetPrototype);