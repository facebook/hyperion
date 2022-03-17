import { AttributeInterceptor, AttributeInterceptorBase } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import * as IElement from "./IElement";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWxlbWVudEF0dHJpYnV0ZUludGVyY2VwdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRWxlbWVudEF0dHJpYnV0ZUludGVyY2VwdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSx3QkFBd0IsRUFBRSxNQUFNLGtEQUFrRCxDQUFDO0FBRWxILE9BQU8sS0FBSyxRQUFRLE1BQU0sWUFBWSxDQUFDO0FBQ3ZDLE9BQU8sS0FBSyxXQUFXLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sS0FBSyxjQUFjLE1BQU0sa0JBQWtCLENBQUM7QUFDbkQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFHdEQsSUFBSSxRQUFRLEdBQUcsR0FBRyxFQUFFO0lBQ2xCLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNuQixjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDdEIsUUFBUSxHQUFHLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUN0QixDQUFDLENBQUE7QUFFRCxNQUFNLE9BQU8sMkJBR1QsU0FBUSxvQkFBb0Q7SUFFOUMsR0FBRyxDQUtqQjtJQUVGLFlBQVksSUFBVSxFQUFFLGVBQTBDO1FBQ2hFLEtBQUssQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLHdCQUF3QixDQUFDLElBQUksRUFDMUM7WUFDRSxPQUFPLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5RCxDQUFDLEVBQ0QsVUFBMEIsS0FBYTtZQUNyQyxPQUFPLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUNGLENBQUM7UUFFRixRQUFRLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQzVDLElBQUksRUFDSixJQUFJLGdCQUFnQixDQUF3QyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUM1RSxDQUFDO1FBRUYsUUFBUSxFQUFFLENBQUM7SUFDYixDQUFDO0NBQ0YifQ==