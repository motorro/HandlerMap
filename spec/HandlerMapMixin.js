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
 * User: motorro
 * Date: 07.06.13
 * Time: 14:10
 */
describe('HandlerMapMixin', function() {
    var listener;
    var evt, target;

    beforeEach(function() {
        listener = {

        };

        evt = document.createEvent("Event");
        evt.initEvent("test", false, false);

        target = document.createElement("DIV");
    });

    afterEach(function(){
        listener.doNotListen();
    });

    describe("listeners", function() {
        var handler, wasCalledAt;

        beforeEach(function(){
            wasCalledAt = undefined;
            handler = {
                handler: function() {
                    wasCalledAt = this;
                }
            };
        });

        it("passed as functions should register be called with 'listener' scope", function(){
            spyOn(handler, "handler").andCallThrough();

            HandlerMapMixin.call(
                listener,
                target,
                {
                    "test":handler.handler
                }
            );

            //target.addEventListener("test", function(){alert("zzzz")});
            target.dispatchEvent(evt);
            expect(handler.handler).toHaveBeenCalledWith(evt);
            expect(wasCalledAt).toBe(listener);
        });

        it("passed as objects without scope should register and be called with 'listener' scope", function(){
            spyOn(handler, "handler").andCallThrough();

            HandlerMapMixin.call(
                listener,
                target,
                {
                    "test":{
                        "fn": handler.handler
                    }
                }
            );

            target.dispatchEvent(evt);
            expect(handler.handler).toHaveBeenCalledWith(evt);
            expect(wasCalledAt).toBe(listener);
        });

        it("passed as objects with scope should register and be called with passed scope", function(){
            spyOn(handler, "handler").andCallThrough();

            HandlerMapMixin.call(
                listener,
                target,
                {
                    "test":{
                        "fn": handler.handler,
                        "scope": handler
                    }
                }
            );

            target.dispatchEvent(evt);
            expect(handler.handler).toHaveBeenCalledWith(evt);
            expect(wasCalledAt).toBe(handler);
        });

        it("should not be called if mixed in with 'deafOnCreate'", function(){
            spyOn(handler, "handler").andCallThrough();

            HandlerMapMixin.call(
                listener,
                target,
                {
                    "test":handler.handler
                },
                true
            );

            target.dispatchEvent(evt);
            expect(handler.handler).not.toHaveBeenCalled();
        });

        it("should not be called if 'doNotListen' was called", function(){
            spyOn(handler, "handler").andCallThrough();

            HandlerMapMixin.call(
                listener,
                target,
                {
                    "test":handler.handler
                }
            );

            target.dispatchEvent(evt);
            expect(handler.handler).toHaveBeenCalled();

            listener.doNotListen();
            target.dispatchEvent(evt);
            expect(handler.handler.callCount).toEqual(1);
        });

        it("should resume operation if 'listen' was called", function(){
            spyOn(handler, "handler").andCallThrough();

            HandlerMapMixin.call(
                listener,
                target,
                {
                    "test":handler.handler
                }
            );

            target.dispatchEvent(evt);
            expect(handler.handler).toHaveBeenCalled();

            listener.doNotListen();
            target.dispatchEvent(evt);
            expect(handler.handler.callCount).toEqual(1);

            listener.listen();
            target.dispatchEvent(evt);
            expect(handler.handler.callCount).toEqual(2);
        });

        describe("changed through 'updateHandlers'", function(){
            var handlers;
            var configs;
            beforeEach(function(){
                handlers = jasmine.createSpyObj('handlers', ['handler1', 'handler2', 'handler3']);

                configs = [
                    {
                        "test":handlers["handler1"]
                    },
                    {
                        "test":handlers["handler2"]
                    },
                    {
                        "test2":handlers["handler3"]
                    }
                ]
            });

            it("should return previous config when calling 'updateHandlers'", function(){
                HandlerMapMixin.call(listener, target, configs[0]);

                var oldSet = listener.updateHandlers(configs[1]);

                expect(oldSet).toBe(configs[0]);
            });

            it("should invoke new handlers and should not invoke previously passed handlers", function(){
                HandlerMapMixin.call(listener, target, configs[0]);

                target.dispatchEvent(evt);
                expect(handlers["handler1"]).toHaveBeenCalled();

                listener.updateHandlers(configs[1]);

                target.dispatchEvent(evt);
                expect(handlers["handler1"].callCount).toEqual(1);
                expect(handlers["handler2"]).toHaveBeenCalled();
            });

            it("should not invoke handlers when reconfigured with 'null'", function(){
                HandlerMapMixin.call(listener, target, configs[0]);

                target.dispatchEvent(evt);
                expect(handlers["handler1"]).toHaveBeenCalled();

                listener.updateHandlers(null);

                target.dispatchEvent(evt);
                expect(handlers["handler1"].callCount).toEqual(1);
            });

            it("should not invoke handlers when reconfigured with '{}'", function(){
                HandlerMapMixin.call(listener, target, configs[0]);

                target.dispatchEvent(evt);
                expect(handlers["handler1"]).toHaveBeenCalled();

                listener.updateHandlers(null);

                target.dispatchEvent(evt);
                expect(handlers["handler1"].callCount).toEqual(1);
            });

            it("should invoke new handlers only for events that were configured originally", function(){
                var evt2 = document.createEvent("Event");
                evt2.initEvent("test2", false, false);

                HandlerMapMixin.call(listener, target, configs[0]);

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"]).toHaveBeenCalled();
                expect(handlers["handler3"]).not.toHaveBeenCalled();

                listener.updateHandlers(configs[2]);
                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"].callCount).toEqual(1);
                expect(handlers["handler3"]).not.toHaveBeenCalled();

                listener.doNotListen();
                listener.listen();

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"].callCount).toEqual(1);
                expect(handlers["handler3"]).not.toHaveBeenCalled();

                listener.updateHandlers(configs[0]);
                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"].callCount).toEqual(2);
                expect(handlers["handler3"]).not.toHaveBeenCalled();

                listener.doNotListen();
                listener.listen();

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"].callCount).toEqual(3);
                expect(handlers["handler3"]).not.toHaveBeenCalled();
            });

            it("should return previous config for given event when calling 'updateHandler'", function(){
                HandlerMapMixin.call(listener, target, configs[0]);

                var oldHandler = listener.updateHandler("test", configs[1]["test"]);

                expect(oldHandler).toBe(configs[0]["test"]);
            });

            it("should reconfigure required event only, invoke new handler and not invoke previously passed handler for a single reconfigured event", function(){
                var config = {
                    "test":handlers["handler1"],
                    "test2":handlers["handler2"]
                };

                var evt2 = document.createEvent("Event");
                evt2.initEvent("test2", false, false);

                HandlerMapMixin.call(listener, target, config);

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"]).toHaveBeenCalled();
                expect(handlers["handler2"]).toHaveBeenCalled();
                expect(handlers["handler3"]).not.toHaveBeenCalled();

                listener.updateHandler("test", handlers["handler3"]);

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"].callCount).toEqual(1);
                expect(handlers["handler2"].callCount).toEqual(2);
                expect(handlers["handler3"]).toHaveBeenCalled();
            });
        });
    });

    describe("chains", function() {
        var handlers;

        beforeEach(function() {
            handlers = jasmine.createSpyObj('handlers', ['handler1', 'handler2']);
        });

        it("should call all handlers bound for event", function(){
            var configs = [
                {
                    "test":handlers["handler1"]
                },
                {
                    "test":handlers["handler2"]
                }
            ];

            HandlerMapMixin.call(
                listener,
                target,
                configs[0]
            );

            HandlerMapMixin.call(
                listener,
                target,
                configs[1]
            );

            target.dispatchEvent(evt);
            expect(handlers["handler1"]).toHaveBeenCalled();
            expect(handlers["handler2"]).toHaveBeenCalled();
            expect(handlers["handler1"].callCount).toEqual(1);
            expect(handlers["handler1"].callCount).toEqual(1);
        });

        it("should chain handlers built-in to listener object", function(){
            listener.handleEvent = function(event) {
                if ("test" === event.type) {
                    handlers["handler1"]();
                }
            };

            HandlerMapMixin.call(
                listener,
                target,
                {
                    "test":handlers["handler2"]
                }
            );

            target.dispatchEvent(evt);
            expect(handlers["handler1"].callCount).toEqual(1);
            expect(handlers["handler2"].callCount).toEqual(1);
        });

        it("should mind targets for each link and handle events from their targets only", function(){
            var configs = [
                {
                    "test":handlers["handler1"]
                },
                {
                    "test":handlers["handler2"]
                }
            ];

            var target2 = document.createElement("DIV");

            HandlerMapMixin.call(
                listener,
                target,
                configs[0]
            );

            HandlerMapMixin.call(
                listener,
                target2,
                configs[1]
            );

            target.dispatchEvent(evt);
            expect(handlers["handler1"]).toHaveBeenCalled();
            expect(handlers["handler2"]).not.toHaveBeenCalled();

            target2.dispatchEvent(evt);
            expect(handlers["handler1"].callCount).toEqual(1);
            expect(handlers["handler2"]).toHaveBeenCalled();
        });

        it("may be used as a handler for several targets", function(){
            var target2 = document.createElement("DIV");

            HandlerMapMixin.call(
                listener,
                target,
                {
                    "test":handlers["handler1"]
                }
            );

            HandlerMapMixin.call(
                listener,
                target2,
                {
                    "test":handlers["handler1"]
                }
            );

            target.dispatchEvent(evt);
            expect(handlers["handler1"]).toHaveBeenCalled();
            expect(handlers["handler1"].callCount).toEqual(1);

            target2.dispatchEvent(evt);
            expect(handlers["handler1"].callCount).toEqual(2);
        });

        it("should not call listeners in all links if 'doNotListen' was called", function(){
            var configs = [
                {
                    "test":handlers["handler1"]
                },
                {
                    "test":handlers["handler2"]
                }
            ];

            var target2 = document.createElement("DIV");

            HandlerMapMixin.call(
                listener,
                target,
                configs[0]
            );

            HandlerMapMixin.call(
                listener,
                target2,
                configs[1]
            );

            target.dispatchEvent(evt);
            target2.dispatchEvent(evt);
            expect(handlers["handler1"]).toHaveBeenCalled();
            expect(handlers["handler2"]).toHaveBeenCalled();

            listener.doNotListen();

            target.dispatchEvent(evt);
            target2.dispatchEvent(evt);
            expect(handlers["handler1"].callCount).toEqual(1);
            expect(handlers["handler2"].callCount).toEqual(1);
        });

        it("should resume operation in all links if 'listen' was called", function(){
            var configs = [
                {
                    "test":handlers["handler1"]
                },
                {
                    "test":handlers["handler2"]
                }
            ];

            var target2 = document.createElement("DIV");

            HandlerMapMixin.call(
                listener,
                target,
                configs[0]
            );

            HandlerMapMixin.call(
                listener,
                target2,
                configs[1]
            );

            target.dispatchEvent(evt);
            target2.dispatchEvent(evt);
            expect(handlers["handler1"]).toHaveBeenCalled();
            expect(handlers["handler2"]).toHaveBeenCalled();

            listener.doNotListen();

            target.dispatchEvent(evt);
            target2.dispatchEvent(evt);
            expect(handlers["handler1"].callCount).toEqual(1);
            expect(handlers["handler2"].callCount).toEqual(1);

            listener.listen();

            target.dispatchEvent(evt);
            target2.dispatchEvent(evt);
            expect(handlers["handler1"].callCount).toEqual(2);
            expect(handlers["handler2"].callCount).toEqual(2);
        });

        describe("changed through 'updateHandlers'", function(){
            it("should reconfigure listeners in all links", function(){
                var newHandler = jasmine.createSpy("newHandler");

                var configs = [
                    {
                        "test":handlers["handler1"]
                    },
                    {
                        "test":handlers["handler2"]
                    },
                    {
                        "test":newHandler
                    }
                ];

                HandlerMapMixin.call(
                    listener,
                    target,
                    configs[0]
                );

                HandlerMapMixin.call(
                    listener,
                    target,
                    configs[1]
                );

                target.dispatchEvent(evt);
                expect(handlers["handler1"]).toHaveBeenCalled();
                expect(handlers["handler2"]).toHaveBeenCalled();
                expect(newHandler).not.toHaveBeenCalled();

                listener.updateHandlers(configs[2]);

                target.dispatchEvent(evt);
                expect(handlers["handler1"].callCount).toEqual(1);
                expect(handlers["handler1"].callCount).toEqual(1);
                expect(newHandler.callCount).toEqual(2);
            });

            it("should reconfigure listeners for events defined in individual link constructor only", function(){
                var newHandlers = jasmine.createSpyObj('newHandlers', ['handler3', 'handler4']);

                var evt2 = document.createEvent("Event");
                evt2.initEvent("test2", false, false);

                var configs = [
                    {
                        "test":handlers["handler1"]
                    },
                    {
                        "test2":handlers["handler2"]
                    },
                    {
                        "test":newHandlers["handler3"],
                        "test2":newHandlers["handler4"]
                    }
                ];

                HandlerMapMixin.call(
                    listener,
                    target,
                    configs[0]
                );

                HandlerMapMixin.call(
                    listener,
                    target,
                    configs[1]
                );

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"].callCount).toEqual(1);
                expect(handlers["handler2"].callCount).toEqual(1);
                expect(newHandlers["handler3"]).not.toHaveBeenCalled();
                expect(newHandlers["handler4"]).not.toHaveBeenCalled();

                listener.updateHandlers(configs[2]);

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                expect(handlers["handler1"].callCount).toEqual(1);
                expect(handlers["handler2"].callCount).toEqual(1);
                expect(newHandlers["handler3"].callCount).toEqual(1);
                expect(newHandlers["handler4"].callCount).toEqual(1);
            });

            it("should reconfigure required event only, invoke new handler and not invoke previously passed handler for a single reconfigured event for each chain link", function(){
                var newHandlers = jasmine.createSpyObj('newHandlers', ['handler3', 'handler4', 'handler5']);

                var evt2 = document.createEvent("Event");
                evt2.initEvent("test2", false, false);

                var evt3 = document.createEvent("Event");
                evt3.initEvent("test3", false, false);

                var config1 = {
                    "test":handlers["handler1"],
                    "test2":handlers["handler2"]
                };

                var config2 = {
                    "test":handlers["handler1"],
                    "test3":newHandlers["handler3"]
                };

                HandlerMapMixin.call(
                    listener,
                    target,
                    config1
                );

                HandlerMapMixin.call(
                    listener,
                    target,
                    config2
                );

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                target.dispatchEvent(evt3);
                expect(handlers["handler1"].callCount).toEqual(2);
                expect(handlers["handler2"].callCount).toEqual(1);
                expect(newHandlers["handler3"].callCount).toEqual(1);
                expect(newHandlers["handler4"]).not.toHaveBeenCalled();
                expect(newHandlers["handler5"]).not.toHaveBeenCalled();

                listener.updateHandler("test2", newHandlers["handler4"]);
                listener.updateHandler("test3", newHandlers["handler5"]);

                target.dispatchEvent(evt);
                target.dispatchEvent(evt2);
                target.dispatchEvent(evt3);
                expect(handlers["handler1"].callCount).toEqual(4);
                expect(handlers["handler2"].callCount).toEqual(1);
                expect(newHandlers["handler3"].callCount).toEqual(1);
                expect(newHandlers["handler4"].callCount).toEqual(1);
                expect(newHandlers["handler5"].callCount).toEqual(1);
            });
        });
    });
});