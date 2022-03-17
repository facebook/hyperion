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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUF0dHJDdXN0b20uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJQXR0ckN1c3RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRCxPQUFPLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQztBQUdqQyxNQUFNLFVBQVUsSUFBSTtJQUNsQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFDM0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDckMsSUFBSSxZQUFZLEVBQUU7WUFDaEIsSUFBSSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6RCxJQUFJLEtBQUssRUFBRTtnQkFDVCxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLE9BQU8sSUFBSSxJQUFJLEVBQUU7b0JBQ25CLE9BQU8sT0FBTyxDQUFDO2lCQUNoQjthQUNGO1NBQ0Y7UUFDRCxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyRCxDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFnQixLQUFLO1FBQ2hELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ3JDLElBQUksWUFBWSxFQUFFO1lBQ2hCLElBQUksS0FBSyxHQUFHLG1CQUFtQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekQsSUFBSSxLQUFLLEVBQUU7Z0JBQ1QsT0FBTyxLQUFLLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQzthQUMvQztTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVELENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyJ9