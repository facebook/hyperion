import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
export var IEventTargetPrototype = new DOMShadowPrototype(EventTarget, null, { sampleObject: sampleHTMLElement });
export var addEventListener = new FunctionInterceptor('addEventListener', IEventTargetPrototype);
export var dispatchEvent = new FunctionInterceptor('dispatchEvent', IEventTargetPrototype);
export var removeEventListener = new FunctionInterceptor('removeEventListener', IEventTargetPrototype);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUV2ZW50VGFyZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSUV2ZW50VGFyZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQzdFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLGlEQUFpRCxDQUFBO0FBRXJGLE1BQU0sQ0FBQyxJQUFNLHFCQUFxQixHQUFHLElBQUksa0JBQWtCLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7QUFFcEgsTUFBTSxDQUFDLElBQU0sZ0JBQWdCLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxrQkFBa0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0FBQ25HLE1BQU0sQ0FBQyxJQUFNLGFBQWEsR0FBRyxJQUFJLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0FBQzdGLE1BQU0sQ0FBQyxJQUFNLG1CQUFtQixHQUFHLElBQUksbUJBQW1CLENBQUMscUJBQXFCLEVBQUUscUJBQXFCLENBQUMsQ0FBQyJ9