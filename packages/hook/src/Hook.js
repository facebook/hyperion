export var EmptyCallback = function () { };
var Hook = /** @class */ (function () {
    function Hook() {
        this.call = EmptyCallback;
    }
    Hook.prototype.hasCallback = function (cb) {
        if (!this._callbacks) {
            return cb ? this.call === cb : this.call !== EmptyCallback;
        }
        else {
            var callbacks = this._callbacks;
            return (callbacks.length > 0 &&
                (!cb ||
                    callbacks.some(function (func) { return func === cb || func._original === cb; })));
        }
    };
    Hook.prototype.createMultiCallbackCall = function (callbacks) {
        var call = function () {
            var currentCallbacks = callbacks; // We could also use this._callbacks
            for (var _i = 0, currentCallbacks_1 = currentCallbacks; _i < currentCallbacks_1.length; _i++) {
                var cb = currentCallbacks_1[_i];
                cb.apply(this, arguments);
            }
        };
        return call;
    };
    Hook.prototype.add = function (cb, once) {
        var callback = cb;
        if (once) {
            var that_1 = this;
            var tmp_1 = function () {
                that_1.remove(tmp_1);
                return cb.apply(this, arguments);
            };
            tmp_1._original = cb;
            callback = tmp_1;
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
    };
    Hook.prototype.remove = function (cb) {
        return this.removeIf(function (f) { return f === cb; });
    };
    Hook.prototype.removeIf = function (condition) {
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
            var previousList = this._callbacks;
            this._callbacks = previousList.filter(function (l) { return !condition(l); });
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
    };
    Hook.prototype.clear = function () {
        if (this.call === EmptyCallback || !this._callbacks) {
            this.call = EmptyCallback;
        }
        else {
            this._callbacks.length = 0;
        }
    };
    return Hook;
}());
export { Hook };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9vay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLElBQU0sYUFBYSxHQUFhLGNBQVEsQ0FBQyxDQUFDO0FBTWpEO0lBQUE7UUFFUyxTQUFJLEdBQWlCLGFBQWEsQ0FBQztJQXNGNUMsQ0FBQztJQW5GQywwQkFBVyxHQUFYLFVBQVksRUFBaUI7UUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDcEIsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGFBQWEsQ0FBQztTQUM1RDthQUFNO1lBQ0wsSUFBTSxTQUFTLEdBQTZCLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDNUQsT0FBTyxDQUNMLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFDcEIsQ0FDRSxDQUFDLEVBQUU7b0JBQ0gsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLElBQUksS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxFQUFFLEVBQXBDLENBQW9DLENBQUMsQ0FDN0QsQ0FDRixDQUFDO1NBQ0g7SUFDSCxDQUFDO0lBRVMsc0NBQXVCLEdBQWpDLFVBQWtDLFNBQXlCO1FBQ3pELElBQU0sSUFBSSxHQUFHO1lBQ1gsSUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsQ0FBQyxvQ0FBb0M7WUFDeEUsS0FBaUIsVUFBZ0IsRUFBaEIscUNBQWdCLEVBQWhCLDhCQUFnQixFQUFoQixJQUFnQixFQUFFO2dCQUE5QixJQUFNLEVBQUUseUJBQUE7Z0JBQ1gsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDM0I7UUFDSCxDQUFDLENBQUE7UUFDRCxPQUFnQyxJQUFLLENBQUM7SUFDeEMsQ0FBQztJQUVNLGtCQUFHLEdBQVYsVUFBVyxFQUFnQixFQUFFLElBQWM7UUFDekMsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksSUFBSSxFQUFFO1lBQ1IsSUFBTSxNQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQU0sS0FBRyxHQUFvQztnQkFDM0MsTUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFHLENBQUMsQ0FBQztnQkFDakIsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNuQyxDQUFDLENBQUM7WUFDRixLQUFHLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNuQixRQUFRLEdBQUcsS0FBRyxDQUFDO1NBQ2hCO1FBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGFBQWEsRUFBRTtZQUMvQixJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztTQUN0QjthQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUMzRDthQUFNO1lBQ0wsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDaEM7UUFDRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxxQkFBTSxHQUFiLFVBQWMsRUFBZ0I7UUFDNUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxLQUFLLEVBQUUsRUFBUixDQUFRLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sdUJBQVEsR0FBZixVQUFnQixTQUF3QztRQUN0RDs7Ozs7Ozs7O1dBU0c7UUFDSCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsSUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBYixDQUFhLENBQUMsQ0FBQztZQUMxRCxtRkFBbUY7WUFDbkYsT0FBTyxZQUFZLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1NBQ3JEO2FBQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLElBQUksQ0FBQyxJQUFJLEdBQWlCLGFBQWEsQ0FBQztZQUN4QyxPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUVNLG9CQUFLLEdBQVo7UUFDRSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuRCxJQUFJLENBQUMsSUFBSSxHQUFpQixhQUFhLENBQUM7U0FDekM7YUFBTTtZQUNMLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7SUFDSCxXQUFDO0FBQUQsQ0FBQyxBQXhGRCxJQXdGQyJ9