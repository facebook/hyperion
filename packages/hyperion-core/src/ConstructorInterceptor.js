/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { FunctionInterceptor } from "./FunctionInterceptor";
import { intercept } from "./intercept";
export class ConstructorInterceptor extends FunctionInterceptor {
    ctorInterceptor = null;
    constructor(name, shadowPrototype) {
        super(name, shadowPrototype /* , true */); //If we intercept constructor, that means we want the output to be intercepted
    }
    setOriginal(originalFunc) {
        const ctorFunc = originalFunc;
        this.ctorInterceptor = function () {
            let result;
            switch (arguments.length) {
                case 0:
                    result = new ctorFunc();
                    break;
                case 1:
                    result = new ctorFunc(arguments[0]);
                    break;
                case 2:
                    result = new ctorFunc(arguments[0], arguments[1]);
                    break;
                case 3:
                    result = new ctorFunc(arguments[0], arguments[1], arguments[2]);
                    break;
                case 4:
                    result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3]);
                    break;
                case 5:
                    result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
                    break;
                case 6:
                    result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                    break;
                default: throw "Unsupported case!";
            }
            return intercept(result);
        };
        return super.setOriginal(this.ctorInterceptor);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uc3RydWN0b3JJbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbnN0cnVjdG9ySW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFFSCxPQUFPLEVBQUUsbUJBQW1CLEVBQTJCLE1BQU0sdUJBQXVCLENBQUM7QUFDckYsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUd4QyxNQUFNLE9BQU8sc0JBSVQsU0FBUSxtQkFBc0M7SUFDeEMsZUFBZSxHQUFvQixJQUFJLENBQUM7SUFDaEQsWUFBWSxJQUFVLEVBQUUsZUFBbUM7UUFDekQsS0FBSyxDQUFDLElBQUksRUFBRSxlQUFlLENBQUEsWUFBWSxDQUFDLENBQUMsQ0FBQyw4RUFBOEU7SUFDMUgsQ0FBQztJQUVNLFdBQVcsQ0FBQyxZQUFzQjtRQUN2QyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUM7UUFDOUIsSUFBSSxDQUFDLGVBQWUsR0FBc0I7WUFDeEMsSUFBSSxNQUFNLENBQUM7WUFDWCxRQUFRLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3hCLEtBQUssQ0FBQztvQkFBRSxNQUFNLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFBQyxNQUFNO2dCQUN2QyxLQUFLLENBQUM7b0JBQUUsTUFBTSxHQUFHLElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU07Z0JBQ25ELEtBQUssQ0FBQztvQkFBRSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU07Z0JBQ2pFLEtBQUssQ0FBQztvQkFBRSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUMvRSxLQUFLLENBQUM7b0JBQUUsTUFBTSxHQUFHLElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU07Z0JBQzdGLEtBQUssQ0FBQztvQkFBRSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU07Z0JBQzNHLEtBQUssQ0FBQztvQkFBRSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN6SCxPQUFPLENBQUMsQ0FBQyxNQUFNLG1CQUFtQixDQUFDO2FBQ3BDO1lBQ0QsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFBO1FBQ0QsT0FBTyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNqRCxDQUFDO0NBQ0YifQ==