/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { Hook } from "@hyperion/hook";
import { isIntercepted } from "@hyperion/hyperion-core/src/intercept";
import { interceptEventListener, isEventListenerObject } from "@hyperion/hyperion-dom/src/IEventListener";
const IS_SETUP_PROP_NAME = `__isSetup`;
export class FlowletManager {
    flowletStack = [];
    top() {
        const last = this.flowletStack.length - 1;
        return last >= 0 ? this.flowletStack[last] : null;
    }
    push(flowlet, reason) {
        this.onPush.call(flowlet, reason);
        this.flowletStack.push(flowlet);
        return flowlet;
    }
    onPush = new Hook();
    /**
     * pop and return top of stack
     * @param flowlet if passed, asserts top matches the input
     * @returns top of the stack or null
     */
    pop(flowlet, reason) {
        let currTop = this.top();
        if (!flowlet) {
            return currTop;
        }
        // __DEV__ && assert(!!flowlet, `Cannot pop undefined flowlet from top of the stack: ${currTop?.fullName()}`);
        if (currTop === flowlet) {
            this.flowletStack.pop();
        }
        else {
            this.flowletStack = this.flowletStack.filter(f => f !== flowlet);
        }
        this.onPop.call(flowlet, reason);
        return currTop;
    }
    onPop = new Hook();
    wrap(listener, apiName) {
        if (!listener) {
            return listener;
        }
        const currentFLowlet = this.top();
        if (!currentFLowlet) {
            return listener;
        }
        const funcInterceptor = interceptEventListener(listener);
        if (!funcInterceptor[IS_SETUP_PROP_NAME]) {
            funcInterceptor[IS_SETUP_PROP_NAME] = true;
            // funcInterceptor.onArgsObserverAdd(() => {
            //   this.push(currentFLowlet);
            // });
            // funcInterceptor.onValueObserverAdd(() => {
            //   this.pop(currentFLowlet);
            // })
            const flowletManager = this;
            funcInterceptor.setCustom(function () {
                const handler = funcInterceptor.getOriginal();
                if (flowletManager.top() === currentFLowlet) {
                    return handler.apply(this, arguments);
                }
                let res;
                let flowlet; // using this extra variable to enable .push to change the value if needed
                try {
                    flowlet = flowletManager.push(currentFLowlet, apiName);
                    res = handler.apply(this, arguments);
                }
                catch (e) {
                    console.error('callback throw', e);
                }
                finally {
                    flowletManager.pop(flowlet, apiName);
                }
                return res;
            });
        }
        return isEventListenerObject(listener) ? listener : funcInterceptor.interceptor;
    }
    unwrap(listener) {
        if (listener && !isEventListenerObject(listener) && isIntercepted(listener)) {
            const funcInterceptor = interceptEventListener(listener);
            return funcInterceptor.getOriginal();
        }
        return listener;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmxvd2xldE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJGbG93bGV0TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0QyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sdUNBQXVDLENBQUM7QUFDdEUsT0FBTyxFQUFnQixzQkFBc0IsRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBSXhILE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDO0FBRXZDLE1BQU0sT0FBTyxjQUFjO0lBQ2pCLFlBQVksR0FBUSxFQUFFLENBQUM7SUFFL0IsR0FBRztRQUNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUMxQyxPQUFPLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNwRCxDQUFDO0lBRUQsSUFBSSxDQUFDLE9BQVUsRUFBRSxNQUFlO1FBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBQ1EsTUFBTSxHQUFHLElBQUksSUFBSSxFQUF5QyxDQUFDO0lBRXBFOzs7O09BSUc7SUFDSCxHQUFHLENBQUMsT0FBVyxFQUFFLE1BQWU7UUFDOUIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQztTQUNoQjtRQUNELDhHQUE4RztRQUM5RyxJQUFJLE9B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