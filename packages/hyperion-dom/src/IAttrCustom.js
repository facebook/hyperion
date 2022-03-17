/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { getVirtualAttribute } from "./DOMShadowPrototype";
import * as IAttr from "./IAttr";
export function init() {
    IAttr.value.getter.setCustom(function () {
        var attr = this;
        var ownerElement = attr.ownerElement;
        if (ownerElement) {
            var vattr = getVirtualAttribute(ownerElement, attr.name);
            if (vattr) {
                var attrVal = vattr.getRawValue(ownerElement);
                if (attrVal != null) {
                    return attrVal;
                }
            }
        }
        return IAttr.value.getter.getOriginal().call(attr);
    });
    IAttr.value.setter.setCustom(function (value) {
        var attr = this;
        var ownerElement = attr.ownerElement;
        if (ownerElement) {
            var vattr = getVirtualAttribute(ownerElement, attr.name);
            if (vattr) {
                return vattr.setRawValue(ownerElement, value);
            }
        }
        return IAttr.value.setter.getOriginal().call(attr, value);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUF0dHJDdXN0b20uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJQXR0ckN1c3RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQzNELE9BQU8sS0FBSyxLQUFLLE1BQU0sU0FBUyxDQUFDO0FBR2pDLE1BQU0sVUFBVSxJQUFJO0lBQ2xCLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUMzQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUNyQyxJQUFJLFlBQVksRUFBRTtZQUNoQixJQUFJLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pELElBQUksS0FBSyxFQUFFO2dCQUNULElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzlDLElBQUksT0FBTyxJQUFJLElBQUksRUFBRTtvQkFDbkIsT0FBTyxPQUFPLENBQUM7aUJBQ2hCO2FBQ0Y7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JELENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQWdCLEtBQUs7UUFDaEQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDckMsSUFBSSxZQUFZLEVBQUU7WUFDaEIsSUFBSSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6RCxJQUFJLEtBQUssRUFBRTtnQkFDVCxPQUFPLEtBQUssQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQy9DO1NBQ0Y7UUFDRCxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUQsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIn0=