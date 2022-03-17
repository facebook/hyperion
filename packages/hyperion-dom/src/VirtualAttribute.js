/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
export class VirtualAttribute {
    rawValue;
    processedValue;
    constructor(rawValue, processedValue) {
        this.rawValue = rawValue;
        this.processedValue = processedValue;
    }
    getRawValue(obj) {
        return this.rawValue.getter.interceptor.call(obj);
    }
    setRawValue(obj, value) {
        return this.rawValue.setter.interceptor.call(obj, value);
    }
    getProcessedValue(obj) {
        return this.processedValue.getter.interceptor.call(obj);
    }
    setProcessedValue(obj, value) {
        return this.processedValue.setter.interceptor.call(obj, value);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmlydHVhbEF0dHJpYnV0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlZpcnR1YWxBdHRyaWJ1dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFJSCxNQUFNLE9BQU8sZ0JBQWdCO0lBU1Q7SUFNQTtJQVBsQixZQUNrQixRQUtmLEVBQ2UsY0FLZjtRQVhlLGFBQVEsR0FBUixRQUFRLENBS3ZCO1FBQ2UsbUJBQWMsR0FBZCxjQUFjLENBSzdCO0lBRUgsQ0FBQztJQUVELFdBQVcsQ0FBQyxHQUFhO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQsV0FBVyxDQUFDLEdBQWEsRUFBRSxLQUFzQjtRQUMvQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxHQUFhO1FBQzdCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQsaUJBQWlCLENBQUMsR0FBYSxFQUFFLEtBQTRCO1FBQzNELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakUsQ0FBQztDQUVGIn0=