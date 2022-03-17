import { assert } from "@hyperion/global";
import { getVirtualAttribute } from "./DOMShadowPrototype";
import * as IElement from "./IElement";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUVsZW1lbnRDdXN0b20uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJRWxlbWVudEN1c3RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDM0QsT0FBTyxLQUFLLFFBQVEsTUFBTSxZQUFZLENBQUM7QUFFdkMsTUFBTSxVQUFVLElBQUk7SUFFbEIsUUFBUSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBZ0IsSUFBSTtRQUNsRCxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUMsSUFBSSxLQUFLLEVBQUU7WUFDVCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtnQkFDcEIsT0FBTyxPQUFPLENBQUM7YUFDaEI7U0FDRjtRQUNELE9BQU8sUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFPLFNBQVMsQ0FBQyxDQUFDO0lBQ3pFLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBZ0IsSUFBSSxFQUFFLEtBQUs7UUFDekQsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlDLElBQUksS0FBSyxFQUFFO1lBQ1QsT0FBTyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN2QzthQUFNO1lBQ0wsT0FBTyxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQU8sU0FBUyxDQUFDLENBQUM7U0FDeEU7SUFDSCxDQUFDLENB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