/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
export class AsyncCounter {
    targetCount;
    count = 0;
    steps = 0;
    resolve;
    promise;
    constructor(targetCount) {
        this.targetCount = targetCount;
        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        });
    }
    getCount() {
        return this.count;
    }
    getSteps() {
        return this.steps;
    }
    tryResolve() {
        if (this.count === this.targetCount) {
            this.resolve(this.count);
        }
    }
    countUp(count = 1) {
        this.count += count;
        ++this.steps;
        this.tryResolve();
        return this;
    }
    countDown(count = 1) {
        this.count -= count;
        ++this.steps;
        this.tryResolve();
        return this;
    }
    reachTarget() {
        return this.promise;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXN5bmNDb3VudGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQXN5bmNDb3VudGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsTUFBTSxPQUFPLFlBQVk7SUFNTTtJQUxyQixLQUFLLEdBQVcsQ0FBQyxDQUFDO0lBQ2xCLEtBQUssR0FBVyxDQUFDLENBQUM7SUFDbEIsT0FBTyxDQUEyQjtJQUN6QixPQUFPLENBQUM7SUFFekIsWUFBNkIsV0FBbUI7UUFBbkIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7UUFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBUyxPQUFPLENBQUMsRUFBRTtZQUMzQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN4QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFHRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFTyxVQUFVO1FBQ2hCLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ25DLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzFCO0lBQ0gsQ0FBQztJQUNELE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDO1FBQ3BCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNiLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNsQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUM7UUFDakIsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUM7UUFDcEIsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ2IsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEIsQ0FBQztDQUNGIn0=