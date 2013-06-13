HandlerMap
==========

HandlerMapMixin is a utility mixin to allow quick HTML DOM event listener management and reconfiguration especialy if you need to maintain a handler to be single and exclusive within a component for particular event.
For example I use it to maintain an exclusive handler for 'back' button pressed event in [Cordova](http://cordova.apache.org/) applications for Android. 

========================================
## Note on Cordova

Cordova dispatches some custom events (like 'backbutton') and their dispatcher is not fully compatible with HTML DOM events and features this utility requires:

* Not compatible with [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener).[Cordova JIRA 3785](https://issues.apache.org/jira/browse/CB-3785)
* `target` and `currentTarget` are always null for those custom event. [Cordova JIRA 3786](https://issues.apache.org/jira/browse/CB-3786)

To subscribe to those custom events you need either monkey-patch Cordova or redispatch events using a kind of [Redispatcher](/blob/master/src/Redispatcher.js):

```javascript
    var docRedispatcher = new Redispatcher(document, "backbutton", "searchbutton", "menubutton");

    // Map hardware buttons (stub)
    HandlerMapMixin.call(
        this,
        docRedispatcher.target,
        {
            "backbutton": function(){console.log("BACK!!!!!!")},
            "searchbutton": function(){console.log("SEARCH!!!!!!")},
            "menubutton": function(){console.log("MENU!!!!!!")}
        }
    );
```

========================================

## Creating a map

Mixin function has the following signature:

    HandlerMapMixin(target, events, deafOnCreate)

Parameters:

* target - object (HTML DOM element) to listen to
* events - event/handler map (see example below)
* deafOnCreate - if truthy will not subscribe passed events at mixin init (to be subscribet explicitly later) 

To create a listener you need to apply mixin to the object you want to be your listener:

```javascript
    var target = document.createElement("DIV");
    var listener = {};
    var handler = function(event) {
        console.log("Event handler called at: ", this);
    }
    
    // Makes 'listener' object to be event handler 
    HandlerMapMixin.call(
        listener,
        target,
        {
            //Event handler will be called within the 'listener' scope
            "test":handler
        }
    );

    // Mekes 'window' object an event handler
    HandlerMapMixin(
        target,
        {
            //Event handler will be called within the 'listener' scope although mixed to global scope
            "test": {
                "fn": handler,
                "scope": listener
            }
        }
    );
```

You can pass event map in several ways.

* A function that will be called within 'listener' scope:

```javascript

    {
        "event":function(e){}
    }

```

* An object to configure the scope to call a handler function:

```javascript

    {
        "event": {
            "fn": function(e){},
            "scope": window
        }
    }

```

* A 'stub' for event to be handled (reconfigured) later within the application workflow.

```javascript

    {
        "event": null
    }

```

*Note*: The events to listen passed to a mixin function are immutable. You can change event handlers later on but not the listened events. See updating event handlers below.

## Reconfiguring event handlers

The handlers in handler map could be reconfigured later within the application workflow. 
There are two functions to do it.
To change a single handler:

    updateHandler (event, handler)

The function sets a new `handler` for the `event`. The returned value is a handler that was assigned previously. The event should be from within the list of initialy configured events. For example:

```javascript
    // Set mixin to handle "test" event
    HandlerMapMixin(
        target,
        {
            "test": function() {console.log("Function 1");}
        }
    );

    // This will reset handler to a new function
    updateHandler("test", function(){console.log("Function 2");}) 
    
    // This will NOT set a handler to manage "test2" event as it was not configured originally
    updateHandler("test2", function(){console.log("Function 3");}) 
```

To change a group of handlers:

    updateHandlers (newSet)

`newSet` is a new handler map in the same format as passed to mixin function. Again the events reconfigured should be from within the list of initialy configured events.

### An example

For example the one needs to maintain a single event handler for the 'back' hardware button in [Cordova](http://cordova.apache.org/) applications for Android. Here is a simplified workflow:

```javascript
    // Initialize listener and initial application state
    // The object may be a true singleton if required
    var listener = {};

    // Application startup. Button performs exit.
    HandlerMapMixin.call(
        listener,
        document,
        {
           "backbutton":function() {
               // Perform exit actions
               exit();
           }
        }
    );

    // Later on we change state to some other 
    goToSettings();
    var originalHandler = listener.updateHandler (
        "backbutton", 
        function() {
            // Switches back to main page
            returnToMain();
            // Resets 'back' listener to original 
            listener.updateHandler (
                "backbutton", 
                originalHandler
            );            
        }
    );
```

## Getting current event handlers

To get currently set handlers you may call:

    getHandlers()      // Returns a last configured handler map
    getHandler("test") // Returns a last configured handler for 'test' event

## Enabling/Disabling listener

To turn on/off all event handlers call:

   listen();      //Subscribes events
   doNotListen(); //Unsubscribes all mapped handlers.

`doNotListen` should also be called when destroying the listener to unbind handlers from target.

## Chains

You can have several mixins chained together. That might come in handy if you compose your application from several parts each handling some events. Chains are executed in LIFO manner for events and reconfigure calls.

```javascript

    // Mixin for back button
    function BackMixin() {
        HandlerMapMixin.call(
            this,
            document,
            {
               "backbutton":function() {
                   // Perform exit actions
                   exit();
               }
            }
        );
    }

    // Mixin for search button
    function SearchMixin() {
        HandlerMapMixin.call(
            this,
            document,
            {
               "searchbutton":function() {
                   // Perform search actions
                   search();
               }
            }
        );
    }

    // Compose main application object
    var app = {};
    BackMixin.call(app);
    SearchMixin.call(app);
    // Thus app is listening to both 'backbutton' and 'searchbutton' events
```

Chain mixing-in could be used for handling (and reconfiguring) the same event on multiple targets with a single handler:

```javascript
    var target1 = document.createElement("DIV");
    target1.setAttribute("id", "target1");
    var target2 = document.createElement("DIV");
    target2.setAttribute("id", "target2");
    
    var listener = {};

    var evt = document.createEvent("Event");
    evt.initEvent("test", false, false);
    
    var testHandler = function(e) {
        // Perform actions
        console.log("testHandler:", e.currentTarget.getAttribute("id"));
    };

    var newTestHandler = function(e) {
        // Perform actions
        console.log("newTestHandler:", e.currentTarget.getAttribute("id"));
    };

    // Listen to button 1
    HandlerMapMixin.call(
       listener,
       target1,
       {
           "test":testHandler
       }
    );
    
    // Listen to button 2
    HandlerMapMixin.call(
       listener,
       target2,
       {
           "test":testHandler
       }
    );

    target1.dispatchEvent(evt);
    // Output: testHandler: target1   
    target2.dispatchEvent(evt);
    // Output: testHandler: target2

    // Reconfigure all handlers with a single operation
    listener.updateHandlers({
        "test":newTestHandler 
    });

    target1.dispatchEvent(evt);
    // Output: newTestHandler: target1   
    target2.dispatchEvent(evt);
    // Output: newTestHandler: target2
);    

```

Mixin implements [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener) interface to handle events, so if you have some 'built-in' handler in your listener it will be chained also:

```javascript
   var listener = {
       handleEvent: function(event) {
           if ("searchbutton" === event.type) {
               builtInActions();
           }
       }
   };

   HandlerMapMixin.call(
      listener,
      document,
      {
          "searchbutton":function() {
              // Perform search actions
              search();
          }
      }
   );

   // When event fires:
   // -- SearchMixin handler executes (as it was the last one mixed in)
   // -- Built in event handler executes
```

## License

MIT: http://rem.mit-license.org