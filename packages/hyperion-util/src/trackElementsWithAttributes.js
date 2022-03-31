/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { Hook } from "@hyperion/hook";
import { ElementAttributeInterceptor } from "@hyperion/hyperion-dom/src/ElementAttributeInterceptor";
import { IElementtPrototype } from "@hyperion/hyperion-dom/src/IElement";
export function trackElementsWithAttributes(attributeNames) {
    const hook = new Hook();
    for (const attr of attributeNames) {
        const vattr = new ElementAttributeInterceptor(attr, IElementtPrototype);
        vattr.raw.setter.onArgsObserverAdd(function (value) {
            hook.call(this, attr, value);
        });
    }
    return hook;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhY2tFbGVtZW50c1dpdGhBdHRyaWJ1dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJhY2tFbGVtZW50c1dpdGhBdHRyaWJ1dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBRSwyQkFBMkIsRUFBRSxNQUFNLHdEQUF3RCxDQUFDO0FBQ3JHLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBSXpFLE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxjQUF3QjtJQUNsRSxNQUFNLElBQUksR0FBZSxJQUFJLElBQUksRUFBRSxDQUFDO0lBRXBDLEtBQUssTUFBTSxJQUFJLElBQUksY0FBYyxFQUFFO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLElBQUksMkJBQTJCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDeEUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsVUFBZ0IsS0FBSztZQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7S0FDSjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyJ9