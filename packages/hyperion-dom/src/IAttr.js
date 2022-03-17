/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { AttributeInterceptor } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { INodePrototype } from "./INode";
export const IAttrPrototype = new DOMShadowPrototype(Attr, INodePrototype, {
    sampleObject: sampleHTMLElement.attributes[0],
    nodeType: document.ATTRIBUTE_NODE
});
export const value = new AttributeInterceptor("value", IAttrPrototype);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUF0dHIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJQXR0ci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtEQUFrRCxDQUFDO0FBQ3hGLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQzdFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFekMsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLElBQUksa0JBQWtCLENBQ2xELElBQUksRUFDSixjQUFjLEVBQ2Q7SUFDRSxZQUFZLEVBQUUsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUM3QyxRQUFRLEVBQUUsUUFBUSxDQUFDLGNBQWM7Q0FDbEMsQ0FDRixDQUFDO0FBRUYsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQW9CLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDIn0=