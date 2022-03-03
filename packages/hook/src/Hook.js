export const EmptyCallback = () => { };
export class Hook {
    _callbacks;
    call = EmptyCallback;
    hasCallback(cb) {
        if (!this._callbacks) {
            return cb ? this.call === cb : this.call !== EmptyCallback;
        }
        else {
            const callbacks = this._callbacks;
            return (callbacks.length > 0 &&
                (!cb ||
                    callbacks.some(func => func === cb || func._original === cb)));
        }
    }
    createMultiCallbackCall(callbacks) {
        const call = function () {
            const currentCallbacks = callbacks; // We could also use this._callbacks
            for (const cb of currentCallbacks) {
                cb.apply(this, arguments);
            }
        };
        return call;
    }
    add(cb, once) {
        let callback = cb;
        if (once) {
            const that = this;
            const tmp = function () {
                that.remove(tmp);
                return cb.apply(this, arguments);
            };
            tmp._original = cb;
            callback = tmp;
        }
        if (this.call === EmptyCallback) {
            this.call = callback;
        }
        else if (!this._callbacks) {
            this._callbacks = [this.call, callback];
            this.call = this.createMultiCallbackCall(this._callbacks);
        }
        else {
            this._callbacks.push(callback);
        }
        return cb;
    }
    remove(cb) {
        return this.removeIf(f => f === cb);
    }
    removeIf(condition) {
        /**
         * Two cases to consider:
         * - remove may be called while a .call is going on, we should make sure
         *   changing the _callbacks list while running them will not break the
         *   ongoing .call, otherwise the index gets messed up.
         * - a listener may have been added multiple times (although a bad practice)
         * So, we make a new copy of the _callbacks list
         * Since remove is called less often, it is ok to make this function more
         * expensive than .call (e.g. detecting when a .call is running)
         */
        if (this._callbacks) {
            const previousList = this._callbacks;
            this._callbacks = previousList.filter(l => !condition(l));
            // Alternatively we can find the index of cb and just replace it with EmptyCallback
            return previousList.length > this._callbacks.length;
        }
        else if (condition(this.call)) {
            this.call = EmptyCallback;
            return true;
        }
        else {
            return false;
        }
    }
    clear() {
        if (this.call === EmptyCallback || !this._callbacks) {
            this.call = EmptyCallback;
        }
        else {
            this._callbacks.length = 0;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9vay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFhLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztBQU1qRCxNQUFNLE9BQU8sSUFBSTtJQUNQLFVBQVUsQ0FBa0I7SUFDN0IsSUFBSSxHQUFpQixhQUFhLENBQUM7SUFHMUMsV0FBVyxDQUFDLEVBQWlCO1FBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BCLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxhQUFhLENBQUM7U0FDNUQ7YUFBTTtZQUNMLE1BQU0sU0FBUyxHQUE2QixJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzVELE9BQU8sQ0FDTCxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUM7Z0JBQ3BCLENBQ0UsQ0FBQyxFQUFFO29CQUNILFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssRUFBRSxDQUFDLENBQzdELENBQ0YsQ0FBQztTQUNIO0lBQ0gsQ0FBQztJQUVTLHVCQUF1QixDQUFDLFNBQXlCO1FBQ3pELE1BQU0sSUFBSSxHQUFHO1lBQ1gsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsQ0FBQyxvQ0FBb0M7WUFDeEUsS0FBSyxNQUFNLEVBQUUsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDakMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDM0I7UUFDSCxDQUFDLENBQUE7UUFDRCxPQUFnQyxJQUFLLENBQUM7SUFDeEMsQ0FBQztJQUVNLEdBQUcsQ0FBQyxFQUFnQixFQUFFLElBQWM7UUFDekMsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksSUFBSSxFQUFFO1lBQ1IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLE1BQU0sR0FBRyxHQUFvQztnQkFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDakIsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNuQyxDQUFDLENBQUM7WUFDRixHQUFHLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNuQixRQUFRLEdBQUcsR0FBRyxDQUFDO1NBQ2hCO1FBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGFBQWEsRUFBRTtZQUMvQixJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztTQUN0QjthQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUMzRDthQUFNO1lBQ0wsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDaEM7UUFDRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxNQUFNLENBQUMsRUFBZ0I7UUFDNUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFTSxRQUFRLENBQUMsU0FBd0M7UUFDdEQ7Ozs7Ozs7OztXQVNHO1FBQ0gsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25CLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxtRkFBbUY7WUFDbkYsT0FBTyxZQUFZLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1NBQ3JEO2FBQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLElBQUksQ0FBQyxJQUFJLEdBQWlCLGFBQWEsQ0FBQztZQUN4QyxPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUVNLEtBQUs7UUFDVixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuRCxJQUFJLENBQUMsSUFBSSxHQUFpQixhQUFhLENBQUM7U0FDekM7YUFBTTtZQUNMLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FDRiJ9