import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
export class ShadowPrototype {
    targetPrototype;
    parentShadoPrototype;
    extension;
    onBeforInterceptObj = new Hook();
    onAfterInterceptObj = new Hook();
    pendingPropertyInterceptors;
    constructor(targetPrototype, parentShadoPrototype) {
        this.targetPrototype = targetPrototype;
        this.parentShadoPrototype = parentShadoPrototype;
        /**
         * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
         * in the following methods
         */
        this.extension = Object.create(parentShadoPrototype?.extension ?? null);
        if ( /* __DEV__ && */this.parentShadoPrototype) {
            let obj = this.targetPrototype;
            let proto = this.parentShadoPrototype.targetPrototype;
            let matched = false;
            while (obj && !matched) {
                matched = obj === proto;
                obj = Object.getPrototypeOf(obj);
            }
            assert(matched, `Invalid prototype chain`);
        }
    }
    callOnBeforeInterceptObject(obj) {
        this.parentShadoPrototype?.callOnBeforeInterceptObject(obj);
        this.onBeforInterceptObj?.call(obj);
    }
    callOnAfterInterceptObject(obj) {
        this.parentShadoPrototype?.callOnAfterInterceptObject(obj);
        this.onAfterInterceptObj?.call(obj);
    }
    interceptObjectItself(obj) {
        this.parentShadoPrototype?.interceptObjectItself(obj);
        // We can make any necessary modificatio to the object itself here
        if (this.pendingPropertyInterceptors) {
            for (const pi of this.pendingPropertyInterceptors) {
                pi.interceptObjectOwnProperties(obj);
            }
        }
    }
    interceptObject(obj) {
        // This behaves similar to how constructors work, i.e. from parent class to child class
        this.callOnBeforeInterceptObject(obj);
        this.interceptObjectItself(obj);
        this.callOnAfterInterceptObject(obj);
    }
    addPendingPropertyInterceptor(pi) {
        if (!this.pendingPropertyInterceptors) {
            this.pendingPropertyInterceptors = [];
        }
        this.pendingPropertyInterceptors.push(pi);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFPdEMsTUFBTSxPQUFPLGVBQWU7SUFPUjtJQUNDO0lBUFYsU0FBUyxDQUFZO0lBQ3JCLG1CQUFtQixHQUFHLElBQUksSUFBSSxFQUE2QixDQUFDO0lBQzVELG1CQUFtQixHQUFHLElBQUksSUFBSSxFQUE2QixDQUFDO0lBQzdELDJCQUEyQixDQUF5QjtJQUU1RCxZQUNrQixlQUEyQixFQUMxQixvQkFBd0Q7UUFEekQsb0JBQWUsR0FBZixlQUFlLENBQVk7UUFDMUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFvQztRQUV6RTs7O1dBR0c7UUFDSCxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDO1FBRXhFLEtBQUksZ0JBQWlCLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUM5QyxJQUFJLEdBQUcsR0FBUSxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ3BDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7WUFDdEQsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUN0QixPQUFPLEdBQUcsR0FBRyxLQUFLLEtBQUssQ0FBQztnQkFDeEIsR0FBRyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEM7WUFDRCxNQUFNLENBQUMsT0FBTyxFQUFFLHlCQUF5QixDQUFDLENBQUE7U0FDM0M7SUFDSCxDQUFDO0lBRU8sMkJBQTJCLENBQUMsR0FBZTtRQUNqRCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsMkJBQTJCLENBQUMsR0FBNEIsQ0FBQyxDQUFDO1FBQ3JGLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVPLDBCQUEwQixDQUFDLEdBQWU7UUFDaEQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLDBCQUEwQixDQUFDLEdBQTRCLENBQUMsQ0FBQztRQUNwRixJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFUyxxQkFBcUIsQ0FBQyxHQUFlO1FBQzdDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxxQkFBcUIsQ0FBQyxHQUE0QixDQUFDLENBQUM7UUFDL0Usa0VBQWtFO1FBQ2xFLElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO1lBQ3BDLEtBQUssTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO2dCQUNqRCxFQUFFLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDdEM7U0FDRjtJQUNILENBQUM7SUFHTSxlQUFlLENBQUMsR0FBZTtRQUNwQyx1RkFBdUY7UUFDdkYsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVNLDZCQUE2QixDQUFDLEVBQXVCO1FBQzFELElBQUksQ0FBQyxJQUFJLENBQUMsMkJBQTJCLEVBQUU7WUFDckMsSUFBSSxDQUFDLDJCQUEyQixHQUFHLEVBQUUsQ0FBQztTQUN2QztRQUNELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGIn0=