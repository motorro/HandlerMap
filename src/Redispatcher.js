/**
 * Redispatcher
 * Small object to redispatch some monkey-patched events in Cordova
 * User: motorro
 * Date: 13.06.13
 * Time: 14:18
 * @constructor
 * @this {Redispatcher}
 * @param {Object} source Source event dispatcher
 * @param {...String} events Events to subscribe
 */
function Redispatcher(source) {
    var me = this;

    me.target = document.createElement("DIV");

    var toSubscribe = Array.prototype.slice.call(arguments, 1);

    var i = toSubscribe.length;
    while (--i >= 0) {
        source.addEventListener(toSubscribe[i], _redispatch, false);
    }

    /**
     * Removes event listeners
     * Call before deleting object
     */
    this.cleanup = function() {
        var i = toSubscribe.length;
        while (--i >= 0) {
            source.removeEventListener(toSubscribe[i], _redispatch, false);
        }
    };

    function _redispatch(event) {
        var newOne = document.createEvent("Events");
        newOne.initEvent(event.type, false, false);

        //Copy all non-standard properties
        var prop;
        for (prop in event) {
            if (event.hasOwnProperty(prop)) {
                if (newOne.hasOwnProperty(prop)) {
                    continue;
                }
                newOne[prop] = event[prop];
            }
        }

        me.target.dispatchEvent(newOne);
    }
}

