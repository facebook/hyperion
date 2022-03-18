/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * This file only contains set of features that ElementAttributeInterceptor
 * needs. They are here to avoid circular depndency between modules.
 */
import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { INodePrototype } from "./INode";
export const IElementtPrototype = new DOMShadowPrototype(Element, INodePrototype, {
    sampleObject: sampleHTMLElement,
    nodeType: document.ELEMENT_NODE
});
IElementtPrototype.extension.useCaseInsensitivePropertyName = true;
export const getAttribute = new FunctionInterceptor('getAttribute', IElementtPrototype);
export const getAttributeNS = new FunctionInterceptor('getAttributeNS', IElementtPrototype);
// export const getAttributeNames = new FunctionInterceptor('getAttributeNames', IElementtPrototype);
// export const getAttributeNode = new FunctionInterceptor('getAttributeNode', IElementtPrototype);
// export const getAttributeNodeNS = new FunctionInterceptor('getAttributeNodeNS', IElementtPrototype);
// export const getBoundingClientRect = new FunctionInterceptor('getBoundingClientRect', IElementtPrototype);
// export const getClientRects = new FunctionInterceptor('getClientRects', IElementtPrototype);
// export const getElementsByClassName = new FunctionInterceptor('getElementsByClassName', IElementtPrototype);
// export const getElementsByTagName = new FunctionInterceptor('getElementsByTagName', IElementtPrototype);
// export const getElementsByTagNameNS = new FunctionInterceptor('getElementsByTagNameNS', IElementtPrototype);
// export const hasAttribute = new FunctionInterceptor('hasAttribute', IElementtPrototype);
// export const hasAttributeNS = new FunctionInterceptor('hasAttributeNS', IElementtPrototype);
// export const hasAttributes = new FunctionInterceptor('hasAttributes', IElementtPrototype);
// export const insertAdjacentElement = new FunctionInterceptor('insertAdjacentElement', IElementtPrototype);
// export const insertAdjacentHTML = new FunctionInterceptor('insertAdjacentHTML', IElementtPrototype);
// export const insertAdjacentText = new FunctionInterceptor('insertAdjacentText', IElementtPrototype);
// export const removeAttribute = new FunctionInterceptor('removeAttribute', IElementtPrototype);
// export const removeAttributeNS = new FunctionInterceptor('removeAttributeNS', IElementtPrototype);
// export const removeAttributeNode = new FunctionInterceptor('removeAttributeNode', IElementtPrototype);
export const setAttribute = new FunctionInterceptor('setAttribute', IElementtPrototype);
export const setAttributeNS = new FunctionInterceptor('setAttributeNS', IElementtPrototype);
export const setAttributeNode = new FunctionInterceptor('setAttributeNode', IElementtPrototype);
export const setAttributeNodeNS = new FunctionInterceptor('setAttributeNodeNS', IElementtPrototype);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUVsZW1lbnRfLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSUVsZW1lbnRfLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztHQUtHO0FBRUgsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0saURBQWlELENBQUM7QUFDdEYsT0FBTyxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDN0UsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUV6QyxNQUFNLENBQUMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLGtCQUFrQixDQUN0RCxPQUFPLEVBQ1AsY0FBYyxFQUNkO0lBQ0UsWUFBWSxFQUFFLGlCQUFpQjtJQUMvQixRQUFRLEVBQUUsUUFBUSxDQUFDLFlBQVk7Q0FDaEMsQ0FDRixDQUFDO0FBQ0Ysa0JBQWtCLENBQUMsU0FBUyxDQUFDLDhCQUE4QixHQUFHLElBQUksQ0FBQztBQUVuRSxNQUFNLENBQUMsTUFBTSxZQUFZLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUN4RixNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0FBQzVGLHFHQUFxRztBQUNyRyxtR0FBbUc7QUFDbkcsdUdBQXVHO0FBQ3ZHLDZHQUE2RztBQUM3RywrRkFBK0Y7QUFDL0YsK0dBQStHO0FBQy9HLDJHQUEyRztBQUMzRywrR0FBK0c7QUFDL0csMkZBQTJGO0FBQzNGLCtGQUErRjtBQUMvRiw2RkFBNkY7QUFDN0YsNkdBQTZHO0FBQzdHLHVHQUF1RztBQUN2Ryx1R0FBdUc7QUFDdkcsaUdBQWlHO0FBQ2pHLHFHQUFxRztBQUNyRyx5R0FBeUc7QUFDekcsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLElBQUksbUJBQW1CLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDeEYsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLElBQUksbUJBQW1CLENBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUM1RixNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLG1CQUFtQixDQUFDLGtCQUFrQixFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDaEcsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxvQkFBb0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDIn0=