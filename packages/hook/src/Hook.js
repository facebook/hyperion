export var EmptyCallback = function () { };
var Hook = /** @class */ (function () {
    function Hook() {
        this.call = EmptyCallback;
    }
    Hook.prototype.CreateMultiCallbackCall = function (callbacks) {
        var call = function () {
            var currentCallbacks = callbacks; // We could also use this._callbacks
            for (var _i = 0, currentCallbacks_1 = currentCallbacks; _i < currentCallbacks_1.length; _i++) {
                var cb = currentCallbacks_1[_i];
                cb.apply(this, arguments);
            }
        };
        return call;
    };
    Hook.prototype.add = function (cb) {
        if (this.call === EmptyCallback) {
            this.call = cb;
        }
        else if (!this._callbacks) {
            this._callbacks = [this.call, cb];
            this.call = this.CreateMultiCallbackCall(this._callbacks);
        }
        else {
            this._callbacks.push(cb);
        }
        return cb;
    };
    return Hook;
}());
export { Hook };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9vay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLElBQU0sYUFBYSxHQUFhLGNBQVEsQ0FBQyxDQUFDO0FBRWpEO0lBQUE7UUFFUyxTQUFJLEdBQWlCLGFBQWEsQ0FBQztJQXVCNUMsQ0FBQztJQXJCVyxzQ0FBdUIsR0FBakMsVUFBa0MsU0FBeUI7UUFDekQsSUFBTSxJQUFJLEdBQUc7WUFDWCxJQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxDQUFDLG9DQUFvQztZQUN4RSxLQUFpQixVQUFnQixFQUFoQixxQ0FBZ0IsRUFBaEIsOEJBQWdCLEVBQWhCLElBQWdCLEVBQUU7Z0JBQTlCLElBQU0sRUFBRSx5QkFBQTtnQkFDWCxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQzthQUMzQjtRQUNILENBQUMsQ0FBQTtRQUNELE9BQWdDLElBQUssQ0FBQztJQUN4QyxDQUFDO0lBRU0sa0JBQUcsR0FBVixVQUFXLEVBQWdCO1FBQ3pCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxhQUFhLEVBQUU7WUFDL0IsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7U0FDaEI7YUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUMzQixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDM0Q7YUFBTTtZQUNMLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzFCO1FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBQ0gsV0FBQztBQUFELENBQUMsQUF6QkQsSUF5QkMifQ==