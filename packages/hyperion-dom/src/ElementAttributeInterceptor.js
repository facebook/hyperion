/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { AttributeInterceptor, AttributeInterceptorBase } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import * as IElement from "./IElement_";
import * as IAttrCustom from "./IAttrCustom";
import * as IElementCustom from "./IElementCustom";
import { VirtualAttribute } from "./VirtualAttribute";
let lazyInit = () => {
    IAttrCustom.init();
    IElementCustom.init();
    lazyInit = () => { };
};
export class ElementAttributeInterceptor extends AttributeInterceptor {
    raw;
    constructor(name, shadowPrototype) {
        super(name, shadowPrototype);
        this.raw = new AttributeInterceptorBase(name, function () {
            return IElement.getAttribute.getOriginal().call(this, name);
        }, function (value) {
            return IElement.setAttribute.getOriginal().call(this, name, value);
        });
        IElement.IElementtPrototype.setVirtualProperty(name, new VirtualAttribute(this.raw, this));
        lazyInit();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWxlbWVudEF0dHJpYnV0ZUludGVyY2VwdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRWxlbWVudEF0dHJpYnV0ZUludGVyY2VwdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxFQUFFLG9CQUFvQixFQUFFLHdCQUF3QixFQUFFLE1BQU0sa0RBQWtELENBQUM7QUFFbEgsT0FBTyxLQUFLLFFBQVEsTUFBTSxhQUFhLENBQUM7QUFDeEMsT0FBTyxLQUFLLFdBQVcsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxLQUFLLGNBQWMsTUFBTSxrQkFBa0IsQ0FBQztBQUNuRCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUd0RCxJQUFJLFFBQVEsR0FBRyxHQUFHLEVBQUU7SUFDbEIsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ25CLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0QixRQUFRLEdBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQTtBQUVELE1BQU0sT0FBTywyQkFHVCxTQUFRLG9CQUFvRDtJQUU5QyxHQUFHLENBS2pCO0lBRUYsWUFBWSxJQUFVLEVBQUUsZUFBMEM7UUFDaEUsS0FBSyxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksd0JBQXdCLENBQUMsSUFBSSxFQUMxQztZQUNFLE9BQU8sUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlELENBQUMsRUFDRCxVQUEwQixLQUFhO1lBQ3JDLE9BQU8sUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQ0YsQ0FBQztRQUVGLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FDNUMsSUFBSSxFQUNKLElBQUksZ0JBQWdCLENBQXdDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQzVFLENBQUM7UUFFRixRQUFRLEVBQUUsQ0FBQztJQUNiLENBQUM7Q0FDRiJ9