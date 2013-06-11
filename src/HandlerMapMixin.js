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
 * HandlerMapMixin
 * Subscribes events passed to mixin function
 * Clients may change handlers on the fly without add/remove
 * Designed to have only one handler per event though not singleton itself
 * to allow for several objects. Also note that if applied to the same object
 * calls to handlers will be chained in LIFO order.
 * @param target Target to listen to
 * @param events Events to listen to. Examples:
 * Just listen:
 * {
 *      "ready":null
 * }
 * Functions:
 * {
 *      "ready": function(event){ ... }
 * }
 * Functions with scope to execute:
 * {
 *      "ready": {
 *                  "fn": function(event){ ... },
 *                  "scope": this
 *               }
 * }
 * @param deafOnCreate If true does not subscribe events on startup
 * User: motorro
 * Date: 07.06.13
 * Time: 10:12
 *
 */
function HandlerMapMixin(target, events, deafOnCreate) {
    // Subscribes all passed events.
    // Empty list passed will not subscribe any event.
    // That may be used to stub some events
    // e.g. do nothing with hardware button event mapping on iOS vs Android in PhoneGap

    //Copy original config to not to spoil original with handler modification
    var eventConfig = {};
    (function(){
        events = events || {};
        for (var e in events) {
            if (events.hasOwnProperty(e)) {
                eventConfig[e] = events[e];
            }
        }
    })();

    // Listening flag
    var deaf = true;

    // Save function chains
    var _handleEvent    = this["handleEvent"];
    var _listen         = this["listen"];
    var _doNotListen    = this["doNotListen"];
    var _updateHandler  = this["updateHandler"];
    var _updateHandlers = this["updateHandlers"];

    /**
     * Event handler
     * @param event
     * @returns {Object}
     * @private
     */
    this.handleEvent = function(event) {
        // Check event's currentTarget corresponds to target passed in constructor
        // That ensures correct event source when called within a chain)
        if (event.currentTarget !== target) {
            return chain();
        }

        var handler = eventConfig && eventConfig[event.type];

        var handlerResult, chainResult;

        // Returns chain result only if no handler is mapped for event
        var returnChain = false;

        if (!handler) {
            returnChain = true;
        } else if ("function" === typeof handler) {
            handlerResult = handler.call(this, event);
        } else if ("object" === typeof handler && "undefined" !== typeof handler["fn"]) {
            handlerResult = handler["fn"].call(handler["scope"] || this, event);
        } else {
            returnChain = true;
        }

        chainResult = chain();

        return returnChain ? chainResult : handlerResult;

        function chain() {
            return  ("function" === typeof _handleEvent)
                    ? chainResult = _handleEvent.call(target, event)
                    : undefined;
        }
    };

    /**
     * Starts event listening
     */
    this.listen = function() {
        if (deaf) {
            for (var e in eventConfig) {
                if (eventConfig.hasOwnProperty(e)) {
                    target.addEventListener(e, this, false);
                }
            }
            deaf = false;
        }

        if ("function" === typeof _listen) {
            _listen.call(this);
        }
    };

    /**
     * Stops event listening
     */
    this.doNotListen = function() {
        if (!deaf) {
            for (var e in eventConfig) {
                if (eventConfig.hasOwnProperty(e)) {
                    target.removeEventListener(e, this);
                }
            }
            deaf = true;
        }

        if ("function" === typeof _doNotListen) {
            _doNotListen.call(this);
        }
    };

    /**
     * Returns current listener setup for given event
     * @returns {Object} Last used listener setup
     */
    this.getHandler = function(event) {
        //A soon as all chain functions go in LIFO order
        //We only need to return last config passed to top-level object
        return events[event];
    };

    /**
     * Updates a handler for a single event
     * @param event Event name
     * Note that you may reset listeners for events that was defined in constructor only
     * That is made on purpose...
     * @param handler Configured handler (function, object etc)
     * @returns {Object} Listener setup used before reset
     */
    this.updateHandler = function(event, handler) {
        if (eventConfig.hasOwnProperty(event)) {
            eventConfig[event] = handler;
        }

        if ("function" === typeof _updateHandler) {
            _updateHandler.call(this, event, handler);
        }

        return this.getHandler(event);
    };

    /**
     * Returns current listener setup
     * @returns {Object} Last used listener setup
     */
    this.getHandlers = function() {
        //A soon as all chain functions go in LIFO order
        //We only need to return last config passed to top-level object
        return events;
    };

    /**
     * Updates listener map
     * @param newSet New listener set
     * Note that you may reset listeners for events that was defined in constructor only
     * That is made on purpose...
     * @returns {Object} Listener setup used before reset
     */
    this.updateHandlers = function(newSet) {
        for (var e in eventConfig) {
            if (eventConfig.hasOwnProperty(e)) {
                eventConfig[e] = (newSet && newSet[e]) || null;
            }
        }

        if ("function" === typeof _updateHandlers) {
            _updateHandlers.call(this, newSet);
        }

        return this.getHandlers();
    };

    // Listen to events by default
    if (!deafOnCreate) {
        this.listen();
    }
}