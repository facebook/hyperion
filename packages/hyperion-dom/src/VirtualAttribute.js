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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmlydHVhbEF0dHJpYnV0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlZpcnR1YWxBdHRyaWJ1dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxPQUFPLGdCQUFnQjtJQVNUO0lBTUE7SUFQbEIsWUFDa0IsUUFLZixFQUNlLGNBS2Y7UUFYZSxhQUFRLEdBQVIsUUFBUSxDQUt2QjtRQUNlLG1CQUFjLEdBQWQsY0FBYyxDQUs3QjtJQUVILENBQUM7SUFFRCxXQUFXLENBQUMsR0FBYTtRQUN2QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELFdBQVcsQ0FBQyxHQUFhLEVBQUUsS0FBc0I7UUFDL0MsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsaUJBQWlCLENBQUMsR0FBYTtRQUM3QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVELGlCQUFpQixDQUFDLEdBQWEsRUFBRSxLQUE0QjtRQUMzRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLENBQUM7Q0FFRiJ9