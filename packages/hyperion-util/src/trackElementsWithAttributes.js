/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { Hook } from "@hyperion/hook";
import { ElementAttributeInterceptor } from "@hyperion/hyperion-dom/src/ElementAttributeInterceptor";
import { IElementtPrototype } from "@hyperion/hyperion-dom/src/IElement";
export default function trackElementsWithAttributes(attributeNames) {
    const hook = new Hook();
    const callback = function () {
        hook.call(this);
    };
    for (const attr of attributeNames) {
        const vattr = new ElementAttributeInterceptor(attr, IElementtPrototype);
        vattr.raw.setter.onArgsObserverAdd(callback);
    }
    return hook;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhY2tFbGVtZW50c1dpdGhBdHRyaWJ1dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJhY2tFbGVtZW50c1dpdGhBdHRyaWJ1dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBRSwyQkFBMkIsRUFBRSxNQUFNLHdEQUF3RCxDQUFDO0FBQ3JHLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBRXpFLE1BQU0sQ0FBQyxPQUFPLFVBQVUsMkJBQTJCLENBQUMsY0FBd0I7SUFDMUUsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQTJCLENBQUM7SUFFakQsTUFBTSxRQUFRLEdBQUc7UUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQTtJQUVELEtBQUssTUFBTSxJQUFJLElBQUksY0FBYyxFQUFFO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLElBQUksMkJBQTJCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDeEUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDOUM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMifQ==