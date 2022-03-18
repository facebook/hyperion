/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { getVirtualAttribute } from "./DOMShadowPrototype";
import * as IElement from "./IElement_";
export function init() {
    IElement.getAttribute.setCustom(function (name) {
        const vattr = getVirtualAttribute(this, name);
        if (vattr) {
            const attrVal = vattr.getRawValue(this);
            if (attrVal !== null) {
                return attrVal;
            }
        }
        return IElement.getAttribute.getOriginal().apply(this, arguments);
    });
    IElement.setAttribute.setCustom(function (name, value) {
        const vattr = getVirtualAttribute(this, name);
        if (vattr) {
            return vattr.setRawValue(this, value);
        }
        else {
            return IElement.setAttribute.getOriginal().apply(this, arguments);
        }
    });
    IElement.getAttributeNS.setCustom(function (_namespace, name) {
        const vattr = getVirtualAttribute(this, name);
        if (vattr) {
            var attrVal = vattr.getRawValue(this);
            if (attrVal !== null) {
                return attrVal;
            }
        }
        return IElement.getAttributeNS.getOriginal().apply(this, arguments);
    });
    IElement.setAttributeNS.setCustom(function (_namespace, name, value) {
        const vattr = getVirtualAttribute(this, name);
        if (vattr) {
            return vattr.setRawValue(this, value);
        }
        else {
            return IElement.setAttributeNS.getOriginal().apply(this, arguments);
        }
    });
    function createSetAttributeNodeCustom(originalFunc) {
        return function (newAttr) {
            var result;
            const notAlreadyAttached = !newAttr.ownerElement;
            const vattr = getVirtualAttribute(this, newAttr.name);
            if (notAlreadyAttached && vattr) {
                //The custom logic for Attr has not run before (see IAttrCustom), so trigger it now
                const value = newAttr.value; //In case .value changes after attaching, or if there is pending custom logic
                result = originalFunc.call(this, newAttr);
                __DEV__ && assert(!!newAttr.ownerElement, "Attr must now be attached to an ownerElement");
                vattr.setRawValue(this, value);
            }
            else {
                result = originalFunc.call(this, newAttr);
            }
            return result;
        };
    }
    IElement.setAttributeNode.setCustom(createSetAttributeNodeCustom(IElement.setAttributeNode.getOriginal()));
    IElement.setAttributeNodeNS.setCustom(createSetAttributeNodeCustom(IElement.setAttributeNodeNS.getOriginal()));
    //TODO: add logic for removeAttribute*
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUVsZW1lbnRDdXN0b20uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJRWxlbWVudEN1c3RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRCxPQUFPLEtBQUssUUFBUSxNQUFNLGFBQWEsQ0FBQztBQUV4QyxNQUFNLFVBQVUsSUFBSTtJQUVsQixRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFnQixJQUFJO1FBQ2xELE1BQU0sS0FBSyxHQUFHLG1CQUFtQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5QyxJQUFJLEtBQUssRUFBRTtZQUNULE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEMsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO2dCQUNwQixPQUFPLE9BQU8sQ0FBQzthQUNoQjtTQUNGO1FBQ0QsT0FBTyxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQU8sU0FBUyxDQUFDLENBQUM7SUFDekUsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFnQixJQUFJLEVBQUUsS0FBSztRQUN6RCxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUMsSUFBSSxLQUFLLEVBQUU7WUFDVCxPQUFPLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3ZDO2FBQU07WUFDTCxPQUFPLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBTyxTQUFTLENBQUMsQ0FBQztTQUN4RTtJ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