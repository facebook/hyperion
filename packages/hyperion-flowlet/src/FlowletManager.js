/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
export class FlowletManager {
    flowletStack = [];
    top() {
        const last = this.flowletStack.length - 1;
        return last >= 0 ? this.flowletStack[last] : null;
    }
    push(flowlet) {
        this.flowletStack.push(flowlet);
        this.onPush.call(flowlet);
        return flowlet;
    }
    onPush = new Hook();
    /**
     * pop and return top of stack
     * @param flowlet if passed, asserts top matches the input
     * @returns top of the stack or null
     */
    pop(flowlet) {
        let currTop = this.top();
        __DEV__ && assert(!flowlet || currTop === flowlet, `Incompatible top of the stack`);
        this.flowletStack.pop();
        this.onPop.call(currTop);
        return currTop;
    }
    onPop = new Hook();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmxvd2xldE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJGbG93bGV0TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFHdEMsTUFBTSxPQUFPLGNBQWM7SUFDakIsWUFBWSxHQUFRLEVBQUUsQ0FBQztJQUUvQixHQUFHO1FBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3BELENBQUM7SUFFRCxJQUFJLENBQUMsT0FBVTtRQUNiLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFDUSxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQXdCLENBQUM7SUFFbkQ7Ozs7T0FJRztJQUNILEdBQUcsQ0FBQyxPQUFXO1FBQ2IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxPQUFPLElBQUksT0FBTyxLQUFLLE9BQU8sRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO1FBQ3BGLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekIsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUNRLEtBQUssR0FBRyxJQUFJLElBQUksRUFBK0IsQ0FBQztDQUMxRCJ9