/*
 The MIT License (MIT)

 Copyright (c) 2013 Nikolai Kotchetkov (https://github.com/motorro/)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

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

    /**
     * Target to listen to
     * @type {HTMLElement}
     */
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

