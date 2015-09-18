(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Predicty = require('predicty'),
    doc = require('doc-js'),
    crel = require('crel'),
    scrollTo = require('scroll-into-view');

function updateCurrentSelection(predictyPick) {
    var currentSuggestionElement = predictyPick.predictionListElement.children[predictyPick.currentSuggestionIndex];
    if(!currentSuggestionElement) {
        return;
    }

    doc(currentSuggestionElement).addClass('current');

    var elementRect = currentSuggestionElement.getBoundingClientRect(),
        parentRect = currentSuggestionElement.offsetParent.getBoundingClientRect();

    if(elementRect.top < (parentRect.top + currentSuggestionElement.clientHeight) || elementRect.bottom > (parentRect.top + currentSuggestionElement.offsetParent.clientHeight)) {
        scrollTo(currentSuggestionElement);
    }
}

function renderPredictions(items, predictyPick){
    if(!predictyPick.predictionListElement) {
        return;
    }

    if(predictyPick.predictionListElement.children.length) {
        predictyPick.clearPredictions();
    }

    var fragment = document.createDocumentFragment();

    items.forEach(function(item) {
        if(!(item in predictyPick.itemElements)) {
            predictyPick.itemElements[item] = crel('button',
                {
                    'class': 'prediction',
                    'type': 'button'
                },
                item
            );

            predictyPick.itemElements[item].addEventListener('click', function() {
                predictyPick._suggestion = item;
                predictyPick._acceptPrediction();
            });
        }

        predictyPick.itemElements[item].className = 'prediction';

        fragment.appendChild(predictyPick.itemElements[item]);
    });

    predictyPick.predictionListElement.appendChild(fragment);
    updateCurrentSelection(predictyPick);
}

function PredictyPick(){
    Predicty.apply(this, arguments);

    var predictyPick = this;
    predictyPick.renderedElement = crel('div', {'class': 'predictyPick'});
    predictyPick.itemElements = {};

    predictyPick.on('value', function(value){
        if (value === '') {
            renderPredictions(predictyPick.items(), predictyPick);
        } else {
            predictyPick._match(value);
        }
    });

    predictyPick.on('items', function(items){
        renderPredictions(items, predictyPick);
    });

    predictyPick.on('accept', function(){
        predictyPick.suggestionElement.innerText = '';
        predictyPick.clearPredictions();
    });

    predictyPick.renderedElement.appendChild(predictyPick.element);

    var predictionListElement = crel('div', {'class': 'predictionList'});
    predictyPick.predictionListElement = predictionListElement;

    predictyPick.renderedElement.appendChild(predictionListElement);
    predictyPick.renderedElement.addEventListener('keydown', function(event) {
        var noMatchedItems = predictyPick.matchedItems.length <= 1;

        if(event.which === 13) { //enter
            if(noMatchedItems && predictyPick._suggestion == null) {
               predictyPick._suggestion = predictyPick.inputElement.value;
            }

            predictyPick._acceptPrediction();
            return;
        }

        if(noMatchedItems && predictyPick.items().length <=1) {
            return;
        }

        var upKeyPressed = event.which === 38,
            downKeyPressed = event.which === 40;

        if(!(downKeyPressed || upKeyPressed)) {
            return;
        }

        if(!event.metaKey) {
            event.preventDefault();
        }

        var parentElement = predictyPick.predictionListElement,
            listLength = parentElement.children.length,
            nextIndex,
            currentSuggestionIndex = predictyPick.currentSuggestionIndex,
            currentIndexSet = typeof currentSuggestionIndex === 'number';

        if(downKeyPressed) { //down
            nextIndex =  currentIndexSet ? currentSuggestionIndex + 1 : 0;
            doc(parentElement.children[currentSuggestionIndex]).removeClass('current');
            currentSuggestionIndex = nextIndex > listLength - 1 ? listLength - 1 : nextIndex;
        }

        if(upKeyPressed) { //up
            nextIndex = currentIndexSet ? currentSuggestionIndex - 1 : listLength - 1;
            doc(parentElement.children[currentSuggestionIndex]).removeClass('current');
            currentSuggestionIndex = nextIndex < 0 ? 0 : nextIndex;
        }

        var currentValue = predictyPick.value();

        var items = predictyPick.matchedItems.length ? predictyPick.matchedItems : predictyPick.items();

        if(currentSuggestionIndex > items.length - 1) {
            currentSuggestionIndex = 1;
        }

        predictyPick.currentSuggestionIndex = currentSuggestionIndex;
        predictyPick._suggestion = items[currentSuggestionIndex];
        predictyPick._updateSuggestion(currentValue, predictyPick._suggestion.slice(currentValue.length));
        updateCurrentSelection(predictyPick);
    });
}
PredictyPick.prototype.constructor = Predicty;
PredictyPick.prototype = Object.create(Predicty.prototype);
PredictyPick.prototype.clearPredictions = function () {
    var predictyPick = this;

    if(!predictyPick.predictionListElement) {
        return;
    }

    while(predictyPick.predictionListElement.firstChild) {
        predictyPick.predictionListElement.removeChild(predictyPick.predictionListElement.firstChild);
    }
};

PredictyPick.prototype._match = function match(value){
    var predictyPick = this;

    var items = this.items();
    var matchedItems = [];

    predictyPick.clearPredictions();

    for(var i = 0; i < items.length; i++){
        if(this._matchItem(value, items[i])){
            matchedItems.push(items[i]);
        }
    }

    predictyPick.matchedItems = matchedItems;

    renderPredictions(matchedItems, predictyPick);

    return matchedItems[0];
};

module.exports = PredictyPick;

},{"crel":2,"doc-js":4,"predicty":8,"scroll-into-view":14}],2:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/*

    This code is not formatted for readability, but rather run-speed and to assist compilers.

    However, the code's intention should be transparent.

    *** IE SUPPORT ***

    If you require this library to work in IE7, add the following after declaring crel.

    var testDiv = document.createElement('div'),
        testLabel = document.createElement('label');

    testDiv.setAttribute('class', 'a');
    testDiv['className'] !== 'a' ? crel.attrMap['class'] = 'className':undefined;
    testDiv.setAttribute('name','a');
    testDiv['name'] !== 'a' ? crel.attrMap['name'] = function(element, value){
        element.id = value;
    }:undefined;


    testLabel.setAttribute('for', 'a');
    testLabel['htmlFor'] !== 'a' ? crel.attrMap['for'] = 'htmlFor':undefined;



*/

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.crel = factory();
    }
}(this, function () {
    var fn = 'function',
        obj = 'object',
        nodeType = 'nodeType',
        textContent = 'textContent',
        setAttribute = 'setAttribute',
        attrMapString = 'attrMap',
        isNodeString = 'isNode',
        isElementString = 'isElement',
        d = typeof document === obj ? document : {},
        isType = function(a, type){
            return typeof a === type;
        },
        isNode = typeof Node === fn ? function (object) {
            return object instanceof Node;
        } :
        // in IE <= 8 Node is an object, obviously..
        function(object){
            return object &&
                isType(object, obj) &&
                (nodeType in object) &&
                isType(object.ownerDocument,obj);
        },
        isElement = function (object) {
            return crel[isNodeString](object) && object[nodeType] === 1;
        },
        isArray = function(a){
            return a instanceof Array;
        },
        appendChild = function(element, child) {
          if(!crel[isNodeString](child)){
              child = d.createTextNode(child);
          }
          element.appendChild(child);
        };


    function crel(){
        var args = arguments, //Note: assigned to a variable to assist compilers. Saves about 40 bytes in closure compiler. Has negligable effect on performance.
            element = args[0],
            child,
            settings = args[1],
            childIndex = 2,
            argumentsLength = args.length,
            attributeMap = crel[attrMapString];

        element = crel[isElementString](element) ? element : d.createElement(element);
        // shortcut
        if(argumentsLength === 1){
            return element;
        }

        if(!isType(settings,obj) || crel[isNodeString](settings) || isArray(settings)) {
            --childIndex;
            settings = null;
        }

        // shortcut if there is only one child that is a string
        if((argumentsLength - childIndex) === 1 && isType(args[childIndex], 'string') && element[textContent] !== undefined){
            element[textContent] = args[childIndex];
        }else{
            for(; childIndex < argumentsLength; ++childIndex){
                child = args[childIndex];

                if(child == null){
                    continue;
                }

                if (isArray(child)) {
                  for (var i=0; i < child.length; ++i) {
                    appendChild(element, child[i]);
                  }
                } else {
                  appendChild(element, child);
                }
            }
        }

        for(var key in settings){
            if(!attributeMap[key]){
                element[setAttribute](key, settings[key]);
            }else{
                var attr = attributeMap[key];
                if(typeof attr === fn){
                    attr(element, settings[key]);
                }else{
                    element[setAttribute](attr, settings[key]);
                }
            }
        }

        return element;
    }

    // Used for mapping one kind of attribute to the supported version of that in bad browsers.
    crel[attrMapString] = {};

    crel[isElementString] = isElement;

    crel[isNodeString] = isNode;

    return crel;
}));

},{}],3:[function(require,module,exports){
var doc = {
    document: typeof document !== 'undefined' ? document : null,
    setDocument: function(d){
        this.document = d;
    }
};

var arrayProto = [],
    isList = require('./isList'),
    getTargets = require('./getTargets')(doc.document),
    getTarget = require('./getTarget')(doc.document),
    space = ' ';


///[README.md]

function isIn(array, item){
    for(var i = 0; i < array.length; i++) {
        if(item === array[i]){
            return true;
        }
    }
}

/**

    ## .find

    finds elements that match the query within the scope of target

        //fluent
        doc(target).find(query);

        //legacy
        doc.find(target, query);
*/

function find(target, query){
    target = getTargets(target);
    if(query == null){
        return target;
    }

    if(isList(target)){
        var results = [];
        for (var i = 0; i < target.length; i++) {
            var subResults = doc.find(target[i], query);
            for(var j = 0; j < subResults.length; j++) {
                if(!isIn(results, subResults[j])){
                    results.push(subResults[j]);
                }
            }
        }
        return results;
    }

    return target ? target.querySelectorAll(query) : [];
}

/**

    ## .findOne

    finds the first element that matches the query within the scope of target

        //fluent
        doc(target).findOne(query);

        //legacy
        doc.findOne(target, query);
*/

function findOne(target, query){
    target = getTarget(target);
    if(query == null){
        return target;
    }

    if(isList(target)){
        var result;
        for (var i = 0; i < target.length; i++) {
            result = findOne(target[i], query);
            if(result){
                break;
            }
        }
        return result;
    }

    return target ? target.querySelector(query) : null;
}

/**

    ## .closest

    recurses up the DOM from the target node, checking if the current element matches the query

        //fluent
        doc(target).closest(query);

        //legacy
        doc.closest(target, query);
*/

function closest(target, query){
    target = getTarget(target);

    if(isList(target)){
        target = target[0];
    }

    while(
        target &&
        target.ownerDocument &&
        !is(target, query)
    ){
        target = target.parentNode;
    }

    return target === doc.document && target !== query ? null : target;
}

/**

    ## .is

    returns true if the target element matches the query

        //fluent
        doc(target).is(query);

        //legacy
        doc.is(target, query);
*/

function is(target, query){
    target = getTarget(target);

    if(isList(target)){
        target = target[0];
    }

    if(!target.ownerDocument || typeof query !== 'string'){
        return target === query;
    }

    if(target === query){
        return true;
    }

    var parentless = !target.parentNode;

    if(parentless){
        // Give the element a parent so that .querySelectorAll can be used
        document.createDocumentFragment().appendChild(target);
    }

    var result = arrayProto.indexOf.call(find(target.parentNode, query), target) >= 0;

    if(parentless){
        target.parentNode.removeChild(target);
    }

    return result;
}

/**

    ## .addClass

    adds classes to the target (space separated string or array)

        //fluent
        doc(target).addClass(query);

        //legacy
        doc.addClass(target, query);
*/

function addClass(target, classes){
    target = getTargets(target);

    if(isList(target)){
        for (var i = 0; i < target.length; i++) {
            addClass(target[i], classes);
        }
        return this;
    }
    if(!classes){
        return this;
    }

    var classes = Array.isArray(classes) ? classes : classes.split(space),
        currentClasses = target.classList ? null : target.className.split(space);

    for(var i = 0; i < classes.length; i++){
        var classToAdd = classes[i];
        if(!classToAdd || classToAdd === space){
            continue;
        }
        if(target.classList){
            target.classList.add(classToAdd);
        } else if(!currentClasses.indexOf(classToAdd)>=0){
            currentClasses.push(classToAdd);
        }
    }
    if(!target.classList){
        target.className = currentClasses.join(space);
    }
    return this;
}

/**

    ## .removeClass

    removes classes from the target (space separated string or array)

        //fluent
        doc(target).removeClass(query);

        //legacy
        doc.removeClass(target, query);
*/

function removeClass(target, classes){
    target = getTargets(target);

    if(isList(target)){
        for (var i = 0; i < target.length; i++) {
            removeClass(target[i], classes);
        }
        return this;
    }

    if(!classes){
        return this;
    }

    var classes = Array.isArray(classes) ? classes : classes.split(space),
        currentClasses = target.classList ? null : target.className.split(space);

    for(var i = 0; i < classes.length; i++){
        var classToRemove = classes[i];
        if(!classToRemove || classToRemove === space){
            continue;
        }
        if(target.classList){
            target.classList.remove(classToRemove);
            continue;
        }
        var removeIndex = currentClasses.indexOf(classToRemove);
        if(removeIndex >= 0){
            currentClasses.splice(removeIndex, 1);
        }
    }
    if(!target.classList){
        target.className = currentClasses.join(space);
    }
    return this;
}

function addEvent(settings){
    var target = getTarget(settings.target);
    if(target){
        target.addEventListener(settings.event, settings.callback, false);
    }else{
        console.warn('No elements matched the selector, so no events were bound.');
    }
}

/**

    ## .on

    binds a callback to a target when a DOM event is raised.

        //fluent
        doc(target/proxy).on(events, target[optional], callback);

    note: if a target is passed to the .on function, doc's target will be used as the proxy.

        //legacy
        doc.on(events, target, query, proxy[optional]);
*/

function on(events, target, callback, proxy){

    proxy = getTargets(proxy);

    if(!proxy){
        target = getTargets(target);
        // handles multiple targets
        if(isList(target)){
            var multiRemoveCallbacks = [];
            for (var i = 0; i < target.length; i++) {
                multiRemoveCallbacks.push(on(events, target[i], callback, proxy));
            }
            return function(){
                while(multiRemoveCallbacks.length){
                    multiRemoveCallbacks.pop();
                }
            };
        }
    }

    // handles multiple proxies
    // Already handles multiple proxies and targets,
    // because the target loop calls this loop.
    if(isList(proxy)){
        var multiRemoveCallbacks = [];
        for (var i = 0; i < proxy.length; i++) {
            multiRemoveCallbacks.push(on(events, target, callback, proxy[i]));
        }
        return function(){
            while(multiRemoveCallbacks.length){
                multiRemoveCallbacks.pop();
            }
        };
    }

    var removeCallbacks = [];

    if(typeof events === 'string'){
        events = events.split(space);
    }

    for(var i = 0; i < events.length; i++){
        var eventSettings = {};
        if(proxy){
            if(proxy === true){
                proxy = doc.document;
            }
            eventSettings.target = proxy;
            eventSettings.callback = function(event){
                var closestTarget = closest(event.target, target);
                if(closestTarget){
                    callback(event, closestTarget);
                }
            };
        }else{
            eventSettings.target = target;
            eventSettings.callback = callback;
        }

        eventSettings.event = events[i];

        addEvent(eventSettings);

        removeCallbacks.push(eventSettings);
    }

    return function(){
        while(removeCallbacks.length){
            var removeCallback = removeCallbacks.pop();
            getTarget(removeCallback.target).removeEventListener(removeCallback.event, removeCallback.callback);
        }
    }
}

/**

    ## .off

    removes events assigned to a target.

        //fluent
        doc(target/proxy).off(events, target[optional], callback);

    note: if a target is passed to the .on function, doc's target will be used as the proxy.

        //legacy
        doc.off(events, target, callback, proxy);
*/

function off(events, target, callback, proxy){
    if(isList(target)){
        for (var i = 0; i < target.length; i++) {
            off(events, target[i], callback, proxy);
        }
        return this;
    }
    if(proxy instanceof Array){
        for (var i = 0; i < proxy.length; i++) {
            off(events, target, callback, proxy[i]);
        }
        return this;
    }

    if(typeof events === 'string'){
        events = events.split(space);
    }

    if(typeof callback !== 'function'){
        proxy = callback;
        callback = null;
    }

    proxy = proxy ? getTarget(proxy) : doc.document;

    var targets = typeof target === 'string' ? find(target, proxy) : [target];

    for(var targetIndex = 0; targetIndex < targets.length; targetIndex++){
        var currentTarget = targets[targetIndex];

        for(var i = 0; i < events.length; i++){
            currentTarget.removeEventListener(events[i], callback);
        }
    }
    return this;
}

/**

    ## .append

    adds elements to a target

        //fluent
        doc(target).append(children);

        //legacy
        doc.append(target, children);
*/

function append(target, children){
    var target = getTarget(target),
        children = getTarget(children);

    if(isList(target)){
        target = target[0];
    }

    if(isList(children)){
        for (var i = 0; i < children.length; i++) {
            append(target, children[i]);
        }
        return;
    }

    target.appendChild(children);
}

/**

    ## .prepend

    adds elements to the front of a target

        //fluent
        doc(target).prepend(children);

        //legacy
        doc.prepend(target, children);
*/

function prepend(target, children){
    var target = getTarget(target),
        children = getTarget(children);

    if(isList(target)){
        target = target[0];
    }

    if(isList(children)){
        //reversed because otherwise the would get put in in the wrong order.
        for (var i = children.length -1; i; i--) {
            prepend(target, children[i]);
        }
        return;
    }

    target.insertBefore(children, target.firstChild);
}

/**

    ## .isVisible

    checks if an element or any of its parents display properties are set to 'none'

        //fluent
        doc(target).isVisible();

        //legacy
        doc.isVisible(target);
*/

function isVisible(target){
    var target = getTarget(target);
    if(!target){
        return;
    }
    if(isList(target)){
        var i = -1;

        while (target[i++] && isVisible(target[i])) {}
        return target.length >= i;
    }
    while(target.parentNode && target.style.display !== 'none'){
        target = target.parentNode;
    }

    return target === doc.document;
}

/**

    ## .indexOfElement

    returns the index of the element within it's parent element.

        //fluent
        doc(target).indexOfElement();

        //legacy
        doc.indexOfElement(target);

*/

function indexOfElement(target) {
    target = getTargets(target);
    if(!target){
        return;
    }

    if(isList(target)){
        target = target[0];
    }

    var i = -1;

    var parent = target.parentElement;

    if(!parent){
        return i;
    }

    while(parent.children[++i] !== target){}

    return i;
}


/**

    ## .ready

    call a callback when the document is ready.

    returns -1 if there is no parentElement on the target.

        //fluent
        doc().ready(callback);

        //legacy
        doc.ready(callback);
*/

function ready(callback){
    if(doc.document && (doc.document.readyState === 'complete' || doc.document.readyState === 'interactive')){
        callback();
    }else if(window.attachEvent){
        document.attachEvent("onreadystatechange", callback);
        window.attachEvent("onLoad",callback);
    }else if(document.addEventListener){
        document.addEventListener("DOMContentLoaded",callback,false);
    }
}

doc.find = find;
doc.findOne = findOne;
doc.closest = closest;
doc.is = is;
doc.addClass = addClass;
doc.removeClass = removeClass;
doc.off = off;
doc.on = on;
doc.append = append;
doc.prepend = prepend;
doc.isVisible = isVisible;
doc.ready = ready;
doc.indexOfElement = indexOfElement;

module.exports = doc;
},{"./getTarget":5,"./getTargets":6,"./isList":7}],4:[function(require,module,exports){
var doc = require('./doc'),
    isList = require('./isList'),
    getTargets = require('./getTargets')(doc.document),
    flocProto = [];

function Floc(items){
    this.push.apply(this, items);
}
Floc.prototype = flocProto;
flocProto.constructor = Floc;

function floc(target){
    var instance = getTargets(target);

    if(!isList(instance)){
        if(instance){
            instance = [instance];
        }else{
            instance = [];
        }
    }
    return new Floc(instance);
}

var returnsSelf = 'addClass removeClass append prepend'.split(' ');

for(var key in doc){
    if(typeof doc[key] === 'function'){
        floc[key] = doc[key];
        flocProto[key] = (function(key){
            var instance = this;
            // This is also extremely dodgy and fast
            return function(a,b,c,d,e,f){
                var result = doc[key](this, a,b,c,d,e,f);

                if(result !== doc && isList(result)){
                    return floc(result);
                }
                if(returnsSelf.indexOf(key) >=0){
                    return instance;
                }
                return result;
            };
        }(key));
    }
}
flocProto.on = function(events, target, callback){
    var proxy = this;
    if(typeof target === 'function'){
        callback = target;
        target = this;
        proxy = null;
    }
    doc.on(events, target, callback, proxy);
    return this;
};

flocProto.off = function(events, target, callback){
    var reference = this;
    if(typeof target === 'function'){
        callback = target;
        target = this;
        reference = null;
    }
    doc.off(events, target, callback, reference);
    return this;
};

flocProto.ready = function(callback){
    doc.ready(callback);
    return this;
};

flocProto.addClass = function(className){
    doc.addClass(this, className);
    return this;
};

flocProto.removeClass = function(className){
    doc.removeClass(this, className);
    return this;
};

module.exports = floc;
},{"./doc":3,"./getTargets":6,"./isList":7}],5:[function(require,module,exports){
var singleId = /^#\w+$/;

module.exports = function(document){
    return function getTarget(target){
        if(typeof target === 'string'){
            if(singleId.exec(target)){
                return document.getElementById(target.slice(1));
            }
            return document.querySelector(target);
        }

        return target;
    };
};
},{}],6:[function(require,module,exports){

var singleClass = /^\.\w+$/,
    singleId = /^#\w+$/,
    singleTag = /^\w+$/;

module.exports = function(document){
    return function getTargets(target){
        if(typeof target === 'string'){
            if(singleId.exec(target)){
                // If you have more than 1 of the same id in your page,
                // thats your own stupid fault.
                return [document.getElementById(target.slice(1))];
            }
            if(singleTag.exec(target)){
                return document.getElementsByTagName(target);
            }
            if(singleClass.exec(target)){
                return document.getElementsByClassName(target.slice(1));
            }
            return document.querySelectorAll(target);
        }

        return target;
    };
};
},{}],7:[function(require,module,exports){
module.exports = function isList(object){
    return object != null && typeof object === 'object' && 'length' in object && !('nodeType' in object) && object.self != object; // in IE8, window.self is window, but it is not === window, but it is == window......... WTF!?
}
},{}],8:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter,
    crel = require('crel'),
    DefaultStyle = require('default-style');

new DefaultStyle('.predicty{display:inline-block;position:relative;height: 25px;width:200px;}.predictyPrediction{opacity:0.2;pointer-events:none;position:absolute; top:0;left:0;right:0;bottom:0;height:0;margin:auto 0;}.predicty *{font: inherit;}.predictyInput{position:absolute;top:0;left:0;bottom:0;right:0;width:100%;}.predictySuggestion, .predictyMask{position:relative; z-index:1;vertical-align:middle; line-height:0;}.predictyMask{opacity:0;padding-right:2px;}');

function Predicty(){
    this._render();
    this._bindEvents();
    this._update();
}
Predicty.prototype = Object.create(EventEmitter.prototype);
Predicty.prototype.constructor = Predicty;
Predicty.prototype._value = '';
Predicty.prototype.value = function(value){
    if(!arguments.length){
        return this._value;
    }

    if(value == this._value){
        return;
    }

    this._value = ''+value;
    this._update();
    this.emit('value', this._value);
};
Predicty.prototype._items = [];
Predicty.prototype.items = function(items){
    if(!arguments.length){
        return this._items;
    }

    if(!Array.isArray(items)){
        return;
    }

    this._items = items.slice();
    this._update();
    this.emit('items', items);
};
Predicty.prototype._acceptPrediction = function(){
    if(this._suggestion != null){
        this.value(this._suggestion);
        this.emit('accept', this._suggestion);
    }
};
Predicty.prototype._matchItem = function(value, item){
    return value && item.toLowerCase().indexOf(value.toLowerCase()) === 0;
};
Predicty.prototype._match = function(value){
    var items = this.items();
    for(var i = 0; i < items.length; i++){
        if(this._matchItem(value, items[i])){
            return items[i];
        }
    }
};
Predicty.prototype._updateValue = function(value){
    this.inputElement.value = value;
};
Predicty.prototype._updateSuggestion = function(value, suggestion){
    this.maskElement.textContent = value;
    this.suggestionElement.textContent = suggestion;
};
Predicty.prototype._update = function(){
    var value = this.value();

    this._suggestion = this._match(value);

    this._updateValue(value);

    if(!this._suggestion){
        this._updateSuggestion(value);
        return;
    }
    this._updateSuggestion(value, this._suggestion.slice(value.length));
};
Predicty.prototype._bindEvents = function(){
    var predicty = this;

    this._inputListener = function(event){
        predicty.value(this.value);
    };

    this._tabListener = function(event){
        if(event.which === 9){
            event.preventDefault();
            predicty._acceptPrediction();
        }
    };

    this.inputElement.addEventListener('keyup', this._inputListener);
    this.inputElement.addEventListener('keydown', this._tabListener);
};
Predicty.prototype._render = function(){
    this.element = crel('span', {'class':'predicty'},
        this.inputElement = crel('input', {'class':'predictyInput'}),
        this.predictionElement = crel('div', {'class':'predictyPrediction'},
            this.maskElement = crel('span', {'class':'predictyMask'}),
            this.suggestionElement = crel('span', {'class':'predictySuggestion'})
        )
    );
};
Predicty._debind = function(){
    if(this._inputListener){
        this.inputElement.removeEventListener('keyup', this._inputListener);
        this._inputListener = null;
    }
    if(this._tabListener){
        this.inputElement.removeEventListener('keydown', this._tabListener);
        this._tabListener = null;
    }
};

module.exports = Predicty;
},{"crel":2,"default-style":9,"events":15}],9:[function(require,module,exports){
var defaultStyles,
    validEnvironment;

function insertTag(){
    document.head.insertBefore(defaultStyles, document.head.childNodes[0]);
}

if(
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof document.createTextNode === 'undefined'
){
    console.warn('No approprate environment, no styles will be added.');
}else{
    validEnvironment = true;

    defaultStyles = document.createElement('style');

    if(document.head){
        insertTag();
    }else{
        addEventListener('load', insertTag);
    }
}

function DefaultStyle(cssText, dontInsert){
    if(!validEnvironment){
        return this;
    }

    this._node = document.createTextNode(cssText || '');

    if(!dontInsert){
        this.insert();
    }
}
DefaultStyle.prototype.insert = function(target){
    if(!validEnvironment){
        return;
    }

    target || (target = defaultStyles);

    target.appendChild(this._node);
};
DefaultStyle.prototype.remove = function(){
    if(!validEnvironment){
        return;
    }

    var parent = this._node.parentElement;
    if(parent){
        parent.removeChild(this._node);
    }
};
DefaultStyle.prototype.css = function(cssText){
    if(!validEnvironment){
        return;
    }

    if(!arguments.length){
        return this._node.textContent;
    }

    this._node.textContent = cssText;
};

module.exports = DefaultStyle;
},{}],10:[function(require,module,exports){
module.exports = [
    'Tammy Dunn',
    'Arthur Morrison',
    'Ralph Fowler',
    'Susan Gray',
    'Jose Graham',
    'Christine Reyes',
    'Dorothy Torres',
    'Christine Smith',
    'Maria Bishop',
    'Susan Parker',
    'Ralph Cunningham',
    'Nicholas Arnold',
    'Rebecca Gray',
    'Carlos Matthews',
    'Anthony Miller',
    'Laura Walker',
    'Ann Hicks',
    'Philip Andrews',
    'Alan Rice',
    'Patrick Webb',
    'Ann Hayes',
    'Linda Hayes',
    'Scott Barnes',
    'Lawrence Marshall',
    'Scott Butler',
    'Anna Rogers',
    'Diana Flores',
    'Gerald Hall',
    'Julie Lawson',
    'Kathryn Simmons',
    'Barbara Rose',
    'Bobby Gardner',
    'Emily Scott',
    'Karen Jacobs',
    'Harry Lane',
    'Russell Dunn',
    'Joan Armstrong',
    'Kevin Willis',
    'Randy Ramos',
    'Beverly Olson',
    'Mary Sanchez',
    'Barbara Arnold',
    'Mildred Thomas',
    'Kathryn Perry',
    'Jean Washington',
    'Paul Coleman',
    'James Kennedy',
    'Patrick Chapman',
    'Philip Dean',
    'Norma Richards',
    'Nicole Sims',
    'Andrew Marshall',
    'Kevin Payne',
    'Jonathan Payne',
    'Lois Ford',
    'Irene Ortiz',
    'Henry Owens',
    'Johnny Gordon',
    'Kathleen Harris',
    'Joan Elliott',
    'Patrick Porter',
    'Irene Gibson',
    'Mark Lewis',
    'Susan Hudson',
    'Shirley Hansen',
    'Ashley Anderson',
    'Justin Henry',
    'Steven Parker',
    'Rose Richardson',
    'Russell Young',
    'Melissa Jordan',
    'Evelyn Barnes',
    'Michelle Mendoza',
    'Daniel Hughes',
    'Dorothy Day',
    'Kelly Anderson',
    'Ruby Stevens',
    'Elizabeth Ortiz',
    'Ernest Gardner',
    'Kathleen Russell',
    'Anne Williams',
    'Debra Harrison',
    'Jason Cruz',
    'Patricia Cunningham',
    'Daniel Bradley',
    'Ryan Butler',
    'Christopher Campbell',
    'Barbara Perry',
    'Diane Sims',
    'Clarence Harvey',
    'Antonio Carpenter',
    'Jennifer Ryan',
    'Phyllis Jordan',
    'Beverly Rice',
    'Samuel Jordan',
    'Alice Henry',
    'Pamela Simmons',
    'Amy Burke',
    'Kathleen Reid',
    'Linda Jackson',
    'Brenda Alvarez',
    'Bruce Hudson',
    'Shawn Harvey',
    'Elizabeth Chapman',
    'Albert Gonzalez',
    'George Miller',
    'Scott Freeman',
    'Brandon Stewart',
    'Terry Chavez',
    'Thomas Hernandez',
    'Helen Carpenter',
    'Jeffrey Johnson',
    'Donna Meyer',
    'Ralph Kelley',
    'Helen Barnes',
    'Gloria Myers',
    'Amanda Duncan',
    'Harold Ferguson',
    'Michelle Campbell',
    'Norma Morrison',
    'Timothy Turner',
    'Jeremy Lane',
    'Maria Watkins',
    'Pamela Olson',
    'Eric Dunn',
    'Scott George',
    'Irene Torres',
    'Wanda Ford',
    'Robin Howell',
    'Katherine Phillips',
    'Earl Peterson',
    'Alice Rice',
    'Irene Gibson',
    'Denise Martinez',
    'Margaret Alvarez',
    'Arthur Perkins',
    'Johnny Gonzalez',
    'Wayne Lynch',
    'Walter Robertson',
    'Chris Lane',
    'Jonathan Cooper',
    'Sean Ramos',
    'Joan Young',
    'Sandra Harper',
    'Angela Coleman',
    'Andrea Duncan',
    'Lois White',
    'Chris Stone',
    'Billy Wilson',
    'Bobby Williams',
    'Thomas Peterson',
    'Christopher Willis',
    'Rachel Welch',
    'Rachel Henderson',
    'Andrea Johnson',
    'Doris Reid',
    'Dorothy Boyd',
    'Antonio Campbell',
    'Angela Harvey',
    'James Simpson',
    'Jeremy Schmidt',
    'Ralph Perkins',
    'Willie Hart',
    'Gloria Rice',
    'Chris Holmes',
    'Randy Woods',
    'Mildred Graham',
    'Joyce Rivera',
    'Juan West',
    'Dorothy Gordon',
    'Terry Mills',
    'Lois Simmons',
    'Harold Gordon',
    'Fred Flores',
    'Steven Montgomery',
    'Cheryl Morrison',
    'Arthur Jackson',
    'Sandra Scott',
    'Christine Peters',
    'Louis Gutierrez',
    'Amy Montgomery',
    'Tammy Peters',
    'Phyllis Chapman',
    'Ashley Cook',
    'Kelly Lawson',
    'Alice Reynolds',
    'Kenneth Lewis',
    'Sean Day',
    'Katherine Phillips',
    'Dennis Kelly',
    'Melissa Day',
    'Brandon Oliver',
    'Paul Murphy',
    'Janet Watkins',
    'Mary Phillips',
    'Ryan Bowman',
    'Helen Riley',
    'Aaron Phillips',
    'Betty Perez',
    'Kathryn Collins',
    'Walter Clark',
    'Andrew Butler',
    'Eugene Shaw',
    'Lori Holmes',
    'Diana Adams',
    'Jeremy Martinez',
    'Steve Banks',
    'Benjamin Henry',
    'Brian Nichols',
    'Joyce Wright',
    'Johnny Cox',
    'Linda Martinez',
    'Bobby Stewart',
    'Susan Dean',
    'Earl Clark',
    'Johnny Cox',
    'Brenda Long',
    'Clarence Bradley',
    'Eric Morgan',
    'Steven Myers',
    'Gregory Nichols',
    'Irene Edwards',
    'Willie Martin',
    'Nancy Riley',
    'Mary Hernandez',
    'Judy Nguyen',
    'Michelle Gutierrez',
    'Bobby Nguyen',
    'Joshua Mason',
    'Maria Hanson',
    'Victor Duncan',
    'Helen Bryant',
    'Stephen Parker',
    'Terry Medina',
    'Mary Johnston',
    'Theresa Burke',
    'Wanda Sanchez',
    'Angela Richards',
    'Amanda Holmes',
    'Gerald Griffin',
    'Gregory Cox',
    'Andrea Garcia',
    'Edward Lawson',
    'Betty Spencer',
    'Jimmy Young',
    'Eric Hansen',
    'Andrea Marshall',
    'Matthew Morgan',
    'Raymond Rivera',
    'Anne Porter',
    'Carl Howell',
    'Joseph Ortiz',
    'Johnny Sanders',
    'Brenda Fox',
    'Margaret Mendoza',
    'Pamela James',
    'Philip Murray',
    'Amanda Johnston',
    'Patrick Bryant',
    'Johnny Stephens',
    'Annie Knight',
    'Dorothy Rogers',
    'Philip Wheeler',
    'Michael Phillips',
    'Joshua Hunter',
    'Sara Rivera',
    'Thomas Jones',
    'Nancy Weaver',
    'Joshua Morgan',
    'Lawrence Rivera',
    'Scott Wood',
    'Brian Chavez',
    'Martin Gonzales',
    'Steven Morrison',
    'Brenda Henderson',
    'Diane Gray',
    'Richard Alexander',
    'Anthony Schmidt',
    'Tammy Fields',
    'Raymond Grant',
    'Lori Weaver',
    'Harold Mason',
    'Karen Stone',
    'Nicole Lawrence',
    'Debra Hicks',
    'Carolyn Hansen',
    'Clarence Gonzalez',
    'Pamela Torres',
    'Ronald Lewis',
    'Jesse Gomez',
    'Donna Gonzalez',
    'Teresa Myers',
    'Donald Spencer',
    'George Murphy',
    'Margaret Carr',
    'Louise Medina',
    'Matthew Ramirez',
    'Ronald Castillo',
    'Brenda Russell',
    'Angela Watkins',
    'Billy Sanders',
    'Chris Martinez',
    'Jerry Barnes',
    'Andrea Hall',
    'Martha Morgan',
    'Jane Diaz',
    'Teresa Scott',
    'Ronald Richards',
    'Robin Bell',
    'Tammy Vasquez',
    'Betty Thompson',
    'Lisa Miller',
    'Victor Fox',
    'Keith Gardner',
    'Carol Martinez',
    'Helen Castillo',
    'William Walker',
    'Emily Evans',
    'Heather Phillips',
    'Jessica Watson',
    'Alice Ford',
    'Chris Hughes',
    'Donald Bryant',
    'Sharon Hunter',
    'Nancy Dixon',
    'Sara Bishop',
    'Marie Jordan',
    'Bonnie Stone',
    'Patrick Hall',
    'Susan Stephens',
    'Janice Kelly',
    'James Garcia',
    'Janice Ross',
    'Mary Howard',
    'Stephanie Morales',
    'Tammy Long',
    'Judith Wheeler',
    'Ruby Thompson',
    'Anthony Boyd',
    'Shawn Lewis',
    'Rebecca Webb',
    'Lawrence Richards',
    'Sara Romero',
    'Sara Fuller',
    'Clarence Simmons',
    'Marilyn Martin',
    'Lillian Ferguson',
    'Paul Porter',
    'Barbara Lopez',
    'Denise Gilbert',
    'Norma Wells',
    'Kelly Hall',
    'Kimberly Sanders',
    'Aaron Webb',
    'Arthur Dixon',
    'Harold Phillips',
    'Kathy Lee',
    'Kevin Wagner',
    'Jane Marshall',
    'Jeffrey Alvarez',
    'Kathleen Wright',
    'Amanda Graham',
    'Albert Hall',
    'Matthew Kelly',
    'Sarah Little',
    'Michelle Stewart',
    'Cheryl Ryan',
    'Jonathan Medina',
    'Jesse Thomas',
    'Diane Cruz',
    'Steven Evans',
    'Arthur Johnston',
    'Margaret Owens',
    'Juan Arnold',
    'Joyce Kelley',
    'Marilyn Jones',
    'Ryan Martin',
    'Amanda Cole',
    'Frances Barnes',
    'James Jacobs',
    'Gerald Oliver',
    'Sara Garcia',
    'Sara Wood',
    'Joan Robinson',
    'Terry Garza',
    'Lisa Cook',
    'Sarah Hunt',
    'Wanda Rice',
    'Donald Ward',
    'Lillian Hansen',
    'Betty Peterson',
    'David Robinson',
    'Adam Ross',
    'Kathleen Reynolds',
    'Bobby Rivera',
    'Helen Jenkins',
    'Larry Brown',
    'Marilyn Fox',
    'Lori Rivera',
    'Evelyn Ray',
    'Steven Gordon',
    'Dennis Kelly',
    'Christine Bell',
    'Maria Morrison',
    'Bobby Reynolds',
    'Clarence Smith',
    'Lois Vasquez',
    'Antonio Hughes',
    'Kathy Day',
    'Diana Bennett',
    'Nancy Schmidt',
    'Jeremy Gonzales',
    'Peter Marshall',
    'David Barnes',
    'Charles Dean',
    'Shawn Cook',
    'Margaret Bishop',
    'Marie Hill',
    'Ruth Foster',
    'Christine Knight',
    'Marie Romero',
    'Julie Freeman',
    'Mildred Crawford',
    'Brian Bennett',
    'Juan Howard',
    'Louise Howell',
    'Anthony Simpson',
    'Nicole Stone',
    'Kenneth Hill',
    'Jesse Watson',
    'Jane Ramos',
    'Linda Stephens',
    'Scott Moore',
    'Victor Ray',
    'Albert Butler',
    'Ernest Richards',
    'Daniel Sullivan',
    'Amy Simpson',
    'Heather Kelly',
    'Denise Long',
    'Bonnie Hicks',
    'Roy Wagner',
    'Lawrence Payne',
    'Ashley Jenkins',
    'Julie Kennedy',
    'Michelle Perry',
    'Jason Sullivan',
    'Sean Hamilton',
    'Adam Payne',
    'Marilyn Medina',
    'Margaret Cox',
    'Earl Flores',
    'Frank Mills',
    'Antonio James',
    'Bruce Vasquez',
    'Patricia Wagner',
    'Joyce Hunt',
    'Diana Gutierrez',
    'Kathryn Gonzalez',
    'Paula Ruiz',
    'Matthew Barnes',
    'Steve Price',
    'Paula Perkins',
    'Joyce Allen',
    'Pamela Garcia',
    'Todd Parker',
    'Emily Ross',
    'Ruby Marshall',
    'Marilyn Harper',
    'Randy Foster',
    'Randy Walker',
    'Walter Diaz',
    'Daniel Ryan',
    'Raymond Gordon',
    'Helen Hughes',
    'Christopher Alexander',
    'Teresa Mcdonald',
    'Alan Williamson',
    'Kathy Anderson',
    'Richard Warren',
    'James Ramirez',
    'Julie Bailey',
    'Todd Jacobs',
    'Jonathan Ellis',
    'Jane Carroll',
    'Lawrence Butler',
    'Randy Simpson',
    'Peter Smith',
    'Ronald Cunningham',
    'Susan Richards',
    'Joseph Peterson',
    'Jose Olson',
    'Phyllis Rodriguez',
    'Lillian Gilbert',
    'Brian Hicks',
    'Cynthia Berry',
    'Jessica Mason',
    'Nicole West',
    'Sean Mendoza',
    'Joseph Wilson',
    'Peter Little',
    'Kenneth Burke',
    'Matthew Grant',
    'Lisa Black',
    'Marilyn Gordon',
    'Ann Kennedy',
    'Jonathan Hudson',
    'Gerald Wallace',
    'Dorothy Richards',
    'Philip Grant',
    'Nancy Mendoza',
    'Ashley Spencer',
    'Timothy Spencer',
    'Jane Simpson',
    'Dorothy Hernandez',
    'Stephanie Stone',
    'Ralph Hernandez',
    'Maria George',
    'Jacqueline Burns',
    'Judith Lewis',
    'Antonio Mitchell',
    'Lisa Phillips',
    'Shirley Knight',
    'Eric Price',
    'Raymond Knight',
    'Chris Patterson',
    'Anne Griffin',
    'Kenneth Schmidt',
    'Lori Foster',
    'Annie Hunter',
    'Shirley Owens',
    'Katherine Robertson',
    'Joshua Kelly',
    'Frank Bryant',
    'Frances Campbell',
    'James Burton',
    'Randy Cruz',
    'Carolyn Shaw',
    'Amanda Boyd',
    'Jeremy Moreno',
    'Stephanie Fisher',
    'Rose Alexander',
    'Karen Day',
    'Clarence Olson',
    'Rose Ward',
    'Ashley Robinson',
    'Aaron Burns',
    'Jeffrey Parker',
    'Theresa Hawkins',
    'Donald Wheeler',
    'Stephen Moreno',
    'Carlos Marshall',
    'Alice Mitchell',
    'Patrick Lewis',
    'Louis Greene',
    'Anne Stephens',
    'Howard Black',
    'Michael Schmidt',
    'Joan Nguyen',
    'Brenda Roberts',
    'Mark Butler',
    'Robin Fuller',
    'Kathy Hudson',
    'Samuel Gonzalez',
    'Barbara Ruiz',
    'Fred Welch',
    'Aaron Montgomery',
    'Mary Harrison',
    'Gregory Simpson',
    'Kelly Watson',
    'Nicholas Ross',
    'Pamela Fernandez',
    'Frances Porter',
    'Harry Coleman',
    'Margaret Russell',
    'Walter Gutierrez',
    'Kathryn Fisher',
    'Joan Sims',
    'Scott Collins',
    'Chris Cole',
    'Emily West',
    'Shawn Edwards',
    'Johnny Hernandez',
    'Anne Wood',
    'Catherine Cox',
    'Frank Robinson',
    'Gregory Powell',
    'Brian Knight',
    'Carolyn Smith',
    'Joe Anderson',
    'Denise Meyer',
    'Nicole Grant',
    'Louis Fields',
    'Brenda Burton',
    'Ashley Jenkins',
    'Linda Lawson',
    'Sara Richardson',
    'Nancy Powell',
    'Janice Holmes',
    'Victor Nguyen',
    'Pamela Bradley',
    'Billy Hughes',
    'Randy Burton',
    'Heather Dixon',
    'Kimberly Black',
    'Kenneth Stone',
    'Jane Gutierrez',
    'Alan Austin',
    'Craig Austin',
    'Deborah Morales',
    'Raymond Thomas',
    'Cheryl Payne',
    'Katherine Willis',
    'Tina Bradley',
    'Sean Wright',
    'George Gonzalez',
    'Johnny Willis',
    'Christine Hill',
    'Joshua Allen',
    'Michael Woods',
    'Ronald Ryan',
    'Paula Fernandez',
    'Barbara Rivera',
    'Ashley Black',
    'Russell Vasquez',
    'Earl Campbell',
    'Lois Henderson',
    'Shirley Lopez',
    'Randy Lawson',
    'Kevin Weaver',
    'Emily Austin',
    'Kelly Harvey',
    'Jennifer Garrett',
    'Evelyn Freeman',
    'Ruby Perkins',
    'Christopher Hamilton',
    'Sarah Olson',
    'Michael Kennedy',
    'Samuel Evans',
    'Teresa Spencer',
    'Kathryn Morris',
    'Lillian Carpenter',
    'Justin Greene',
    'Ronald Scott',
    'Justin Stone',
    'Elizabeth Fisher',
    'Tina Collins',
    'Shirley Wright',
    'Kathleen Stephens',
    'Jose Jackson',
    'Jonathan Freeman',
    'Jean Murray',
    'Gary Foster',
    'Anne Nguyen',
    'Jose Fernandez',
    'Raymond Reyes',
    'Mildred Rodriguez',
    'Rose Carr',
    'John Marshall',
    'Jessica Willis',
    'Paul Banks',
    'Steve Williams',
    'Ronald Carroll',
    'Randy Mills',
    'Aaron Gonzalez',
    'Emily Mitchell',
    'Cynthia Porter',
    'Harold Spencer',
    'Johnny Reynolds',
    'George Arnold',
    'Wanda West',
    'Laura Stone',
    'Lois Simpson',
    'Kenneth Wilson',
    'Carlos Brown',
    'Christine Bradley',
    'Raymond Gonzales',
    'Joan Adams',
    'Sara Webb',
    'Julie Fisher',
    'Amy Vasquez',
    'Steve Meyer',
    'Carlos Peters',
    'Judith Fisher',
    'Phyllis Williams',
    'Donald Myers',
    'Jennifer Collins',
    'Deborah Harper',
    'Ralph Wells',
    'Betty Howell',
    'Brandon Frazier',
    'Sara Shaw',
    'Ruby Alvarez',
    'Justin Campbell',
    'Sandra Patterson',
    'Alan Young',
    'Teresa Morris',
    'Eugene Hanson',
    'David Lewis',
    'Earl Edwards',
    'Irene Stevens',
    'Jacqueline Hansen',
    'Christopher Wagner',
    'Edward George',
    'Katherine Alvarez',
    'Chris Davis',
    'Juan Fernandez',
    'Theresa Woods',
    'Justin Mccoy',
    'David Reyes',
    'Kimberly Reynolds',
    'Anne Long',
    'Kimberly Wilson',
    'Amanda Hill',
    'Jeffrey Hamilton',
    'Stephanie Fuller',
    'Jerry Patterson',
    'Lois Young',
    'Robin Stephens',
    'George Bailey',
    'Sean Brown',
    'Theresa Mills',
    'Mark Vasquez',
    'Joan Romero',
    'Nancy Taylor',
    'Justin Riley',
    'Eric Hart',
    'Joseph Burns',
    'Randy Mcdonald',
    'Martin Gibson',
    'Paula Nelson',
    'Matthew Riley',
    'Mary Morgan',
    'Denise Campbell',
    'Phyllis Ramirez',
    'Jacqueline Webb',
    'Dennis Burns',
    'Christine Turner',
    'Lisa James',
    'Samuel Moreno',
    'Daniel Burns',
    'Stephen Banks',
    'Katherine Washington',
    'Emily Wilson',
    'Dennis Rogers',
    'Sean Stone',
    'David Wallace',
    'Norma Kelly',
    'Mildred Boyd',
    'Kathryn Collins',
    'Phillip Sanders',
    'John Garza',
    'Betty Welch',
    'Stephen Jackson',
    'Gerald Crawford',
    'Joseph Ford',
    'Barbara Murray',
    'Dennis Davis',
    'Robin Price',
    'Jack Crawford',
    'Richard Mccoy',
    'Linda Moore',
    'Melissa Nichols',
    'Lisa Lopez',
    'Catherine Montgomery',
    'Jane Bradley',
    'Eugene Banks',
    'Alice Kelly',
    'Jerry Fowler',
    'Richard Barnes',
    'Scott Olson',
    'Joyce Day',
    'Howard Parker',
    'Bonnie Vasquez',
    'Dorothy Montgomery',
    'Bobby Bradley',
    'Joseph Mitchell',
    'Paul Lynch',
    'Russell Stephens',
    'Walter Tucker',
    'Christina Clark',
    'Wanda Weaver',
    'Melissa Campbell',
    'Louise Mitchell',
    'Katherine Arnold',
    'Alan Carroll',
    'Jane Barnes',
    'Wayne Jordan',
    'Nicholas Wheeler',
    'Terry Hansen',
    'Jerry Chapman',
    'Jimmy Fisher',
    'Henry Chavez',
    'Cynthia Simmons',
    'David Smith',
    'Cheryl Robertson',
    'Brian Diaz',
    'Shawn Nguyen',
    'Jeremy Welch',
    'Gregory Marshall',
    'Jessica Ruiz',
    'Joyce Hunter',
    'Joe George',
    'Nancy Welch',
    'Joseph Armstrong',
    'Jose Lawrence',
    'Bobby Phillips',
    'Jacqueline Johnson',
    'Donna Fields',
    'Stephen Snyder',
    'Chris Berry',
    'Christina Vasquez',
    'Denise Nelson',
    'Sharon Hill',
    'Denise Moore',
    'Margaret Marshall',
    'Brian Cook',
    'Virginia Daniels',
    'Robert Washington',
    'Helen Kennedy',
    'Maria Oliver',
    'Jesse Stewart',
    'Emily Ellis',
    'Benjamin Butler',
    'Brandon Parker',
    'Brandon Wright',
    'David Reid',
    'Todd Long',
    'Earl Grant',
    'Julia Martinez',
    'Phyllis Gonzalez',
    'Anne Rogers',
    'Rebecca Taylor',
    'Robin Moreno',
    'Gary Ward',
    'Bruce Bell',
    'Fred Bowman',
    'Steven Alexander',
    'Daniel Allen',
    'Beverly Henderson',
    'Mildred Sullivan',
    'Sarah Cooper',
    'Donald Robertson',
    'Paula Graham',
    'Tammy Wallace',
    'Joan Lopez',
    'Lawrence Hamilton',
    'Jacqueline Garrett',
    'Norma Parker',
    'Fred Price',
    'Kevin Butler',
    'Lois Washington',
    'Joshua James',
    'Ashley Hayes',
    'Barbara Bradley',
    'George Matthews',
    'Nicholas Myers',
    'Chris Dean',
    'Bobby Wallace',
    'Emily Powell',
    'Nancy Peters',
    'Christopher Evans',
    'Shawn Montgomery',
    'Jimmy Ramos',
    'Randy Hawkins',
    'Deborah Shaw',
    'Ronald Hart',
    'Mildred Day',
    'Russell Fields',
    'Philip Palmer',
    'Ralph Nichols',
    'Carol Armstrong',
    'Annie Cole',
    'Patrick Snyder',
    'Christina Duncan',
    'Kenneth Diaz',
    'Melissa Grant',
    'Richard Bennett',
    'Walter Martin',
    'Katherine Palmer',
    'Lillian Sullivan',
    'Joan Perez',
    'Sharon Hayes',
    'Steve Evans',
    'Eric Owens',
    'Ronald Fuller',
    'Douglas Arnold',
    'Judith King',
    'Lisa Mitchell',
    'Deborah Myers',
    'Nancy Lawson',
    'Melissa Watkins',
    'Dennis Henry',
    'Debra Stephens',
    'Shawn Torres',
    'Margaret Lane',
    'Victor Andrews',
    'Antonio Dean',
    'Jose Wilson',
    'Thomas Myers',
    'Alan West',
    'Linda Brooks',
    'Frances Turner',
    'Carl Alvarez',
    'Peter Foster',
    'Shirley Gray',
    'Louise Phillips',
    'Sean Mills',
    'James Hamilton',
    'Theresa Smith',
    'Adam Nichols',
    'Jack Collins',
    'Anne Allen',
    'Willie James',
    'Lillian Powell',
    'William Gutierrez',
    'Clarence Perkins',
    'Andrea Long',
    'Doris Edwards',
    'Steven Wilson',
    'Daniel Watson',
    'Howard Gutierrez',
    'Fred Jackson',
    'Joyce Wells',
    'Janet Woods',
    'Nancy Austin',
    'Cynthia Fox',
    'Robin Fowler',
    'Denise Carter',
    'Tina Wells',
    'Eugene Morgan',
    'Lillian Freeman',
    'Tammy Johnston',
    'Nancy Castillo',
    'Philip Jacobs',
    'Diane Fox',
    'Roger Hawkins',
    'Philip Rivera',
    'Timothy Ray',
    'William Riley',
    'Gerald Vasquez',
    'Richard Gonzalez',
    'Shirley Brown',
    'Elizabeth Pierce',
    'Earl Welch',
    'Margaret Hall',
    'Ernest Murphy',
    'Joshua Wright',
    'Amanda Hunt',
    'Willie Burton',
    'Tina Hall',
    'Harry Perkins',
    'Marie Hall',
    'Julia Stephens',
    'Matthew Gordon',
    'Jeremy Snyder',
    'Gregory Freeman',
    'Gregory Fernandez',
    'Ann Jackson',
    'Jeffrey Ryan',
    'Timothy Mccoy',
    'Samuel Welch',
    'Larry Foster',
    'Susan Garcia',
    'Sara Gardner',
    'John Wallace',
    'Jane Banks',
    'Brenda Payne',
    'Mary Harper',
    'Phillip Hawkins',
    'Justin Lane',
    'Louis Martin',
    'Gerald Larson',
    'Phillip Ruiz',
    'Gregory Rogers',
    'Angela Rivera',
    'Carl Payne',
    'Margaret Kim',
    'Wanda Richards',
    'John Cruz',
    'Cheryl Murphy',
    'Melissa Jordan',
    'Robert Ray',
    'Benjamin Sims',
    'Joan Sullivan',
    'Wayne Weaver',
    'Rebecca Reid',
    'Wayne Sanchez',
    'Barbara Williams',
    'Larry Kelly',
    'Doris Henry',
    'Andrew Ellis',
    'Christina Myers',
    'Dorothy Jones',
    'Kathy Alexander',
    'Adam Bell',
    'Rebecca Lawson',
    'Willie Cruz',
    'Tina Gordon',
    'Earl Mills'
];
},{}],11:[function(require,module,exports){
var PredictyPick = require('../'),
    data = require('./data');

window.onload = function(){
    var predictyPick = new PredictyPick();
    predictyPick.items(data);

    predictyPick.on('accept', function(acceptedValue) {
        alert('AcceptedValue: ' + acceptedValue);
    });

    document.body.appendChild(predictyPick.renderedElement);
};
},{"../":1,"./data":10}],12:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(global, fn)
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":13}],13:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.7.1
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

}).call(this,require('_process'))

},{"_process":16}],14:[function(require,module,exports){
var raf = require('raf');

function setElementScroll(element, x, y){
    if(element === window){
        element.scrollTo(x, y);
    }else{
        element.scrollLeft = x;
        element.scrollTop = y;
    }
}

function getTargetScrollLocation(target, parent, align){
    var targetPosition = target.getBoundingClientRect(),
        parentPosition,
        x,
        y,
        differenceX,
        differenceY,
        leftAlign = align && align.left != null ? align.left : 0.5,
        topAlign = align && align.top != null ? align.top : 0.5,
        leftScalar = leftAlign,
        topScalar = topAlign;

    if(parent === window){
        x = targetPosition.left + window.scrollX - window.innerWidth * leftScalar + Math.min(targetPosition.width, window.innerWidth) * leftScalar;
        y = targetPosition.top + window.scrollY - window.innerHeight * topScalar + Math.min(targetPosition.height, window.innerHeight) * topScalar;
        x = Math.max(Math.min(x, document.body.scrollWidth - window.innerWidth * leftScalar), 0);
        y = Math.max(Math.min(y, document.body.scrollHeight- window.innerHeight * topScalar), 0);
        differenceX = x - window.scrollX;
        differenceY = y - window.scrollY;
    }else{
        parentPosition = parent.getBoundingClientRect();
        var offsetTop = targetPosition.top - (parentPosition.top - parent.scrollTop);
        var offsetLeft = targetPosition.left - (parentPosition.left - parent.scrollLeft);
        x = offsetLeft + (targetPosition.width * leftScalar) - parent.clientWidth * leftScalar;
        y = offsetTop + (targetPosition.height * topScalar) - parent.clientHeight * topScalar;
        x = Math.max(Math.min(x, parent.scrollWidth - parent.clientWidth), 0);
        y = Math.max(Math.min(y, parent.scrollHeight - parent.clientHeight), 0);
        differenceX = x - parent.scrollLeft;
        differenceY = y - parent.scrollTop;
    }

    return {
        x: x,
        y: y,
        differenceX: differenceX,
        differenceY: differenceY
    };
}

function animate(parent){
    raf(function(){
        var scrollSettings = parent._scrollSettings;
        if(!scrollSettings){
            return;
        }

        var location = getTargetScrollLocation(scrollSettings.target, parent, scrollSettings.align),
            time = Date.now() - scrollSettings.startTime,
            timeValue = Math.min(1 / scrollSettings.time * time, 1);

        if(
            time > scrollSettings.time + 20 ||
            (Math.abs(location.differenceY) <= 1 && Math.abs(location.differenceX) <= 1)
        ){
            setElementScroll(parent, location.x, location.y);
            parent._scrollSettings = null;
            return scrollSettings.end();
        }

        var valueX = timeValue,
            valueY = timeValue;

        setElementScroll(parent,
            location.x - location.differenceX * Math.pow(1 - valueX, valueX / 2),
            location.y - location.differenceY * Math.pow(1 - valueY, valueY / 2)
        );

        animate(parent);
    });
}

function transitionScrollTo(target, parent, settings, callback){
    var idle = !parent._scrollSettings;

    if(parent._scrollSettings){
        parent._scrollSettings.end();
    }

    function end(){
        parent._scrollSettings = null;
        callback();
        parent.removeEventListener('touchstart', end);
    }

    parent._scrollSettings = {
        startTime: Date.now(),
        target: target,
        time: settings.time,
        ease: settings.ease,
        align: settings.align,
        end: end
    };
    parent.addEventListener('touchstart', end);

    if(idle){
        animate(parent);
    }
}

module.exports = function(target, settings, callback){
    if(!target){
        return;
    }

    if(typeof settings === 'function'){
        callback = settings;
        settings = null;
    }

    if(!settings){
        settings = {};
    }

    settings.time = settings.time || 1000;
    settings.ease = settings.ease || function(v){return v;};

    var parent = target.parentElement,
        parents = 0;

    function done(){
        parents--;
        if(!parents){
            callback && callback();
        }
    }

    while(parent){
        if(
            settings.validTarget ? settings.validTarget(parent, parents) : true &&
            parent === window ||
            (
                parent.scrollHeight !== parent.clientHeight ||
                parent.scrollWidth !== parent.clientWidth
            ) &&
            getComputedStyle(parent).overflow !== 'hidden'
        ){
            parents++;
            transitionScrollTo(target, parent, settings, done);
        }

        parent = parent.parentElement;

        if(!parent){
            return;
        }

        if(parent.tagName === 'BODY'){
            parent = window;
        }
    }
};
},{"raf":12}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],16:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[11])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jcmVsL2NyZWwuanMiLCJub2RlX21vZHVsZXMvZG9jLWpzL2RvYy5qcyIsIm5vZGVfbW9kdWxlcy9kb2MtanMvZmx1ZW50LmpzIiwibm9kZV9tb2R1bGVzL2RvYy1qcy9nZXRUYXJnZXQuanMiLCJub2RlX21vZHVsZXMvZG9jLWpzL2dldFRhcmdldHMuanMiLCJub2RlX21vZHVsZXMvZG9jLWpzL2lzTGlzdC5qcyIsIm5vZGVfbW9kdWxlcy9wcmVkaWN0eS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcmVkaWN0eS9ub2RlX21vZHVsZXMvZGVmYXVsdC1zdHlsZS9pbmRleC5qcyIsInRlc3RzL2RhdGEuanMiLCJ0ZXN0cyIsIi4uL3RlbmFudC1jbGllbnQvbm9kZV9tb2R1bGVzL3Njcm9sbC1pbnRvLXZpZXcvbm9kZV9tb2R1bGVzL3JhZi9pbmRleC5qcyIsIi4uL3RlbmFudC1jbGllbnQvbm9kZV9tb2R1bGVzL3Njcm9sbC1pbnRvLXZpZXcvbm9kZV9tb2R1bGVzL3JhZi9ub2RlX21vZHVsZXMvcGVyZm9ybWFuY2Utbm93L2xpYi9wZXJmb3JtYW5jZS1ub3cuanMiLCIuLi90ZW5hbnQtY2xpZW50L25vZGVfbW9kdWxlcy9zY3JvbGwtaW50by12aWV3L3Njcm9sbEludG9WaWV3LmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIuLi8uLi8uLi8uLi91c3IvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeitCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUHJlZGljdHkgPSByZXF1aXJlKCdwcmVkaWN0eScpLFxuICAgIGRvYyA9IHJlcXVpcmUoJ2RvYy1qcycpLFxuICAgIGNyZWwgPSByZXF1aXJlKCdjcmVsJyksXG4gICAgc2Nyb2xsVG8gPSByZXF1aXJlKCdzY3JvbGwtaW50by12aWV3Jyk7XG5cbmZ1bmN0aW9uIHVwZGF0ZUN1cnJlbnRTZWxlY3Rpb24ocHJlZGljdHlQaWNrKSB7XG4gICAgdmFyIGN1cnJlbnRTdWdnZXN0aW9uRWxlbWVudCA9IHByZWRpY3R5UGljay5wcmVkaWN0aW9uTGlzdEVsZW1lbnQuY2hpbGRyZW5bcHJlZGljdHlQaWNrLmN1cnJlbnRTdWdnZXN0aW9uSW5kZXhdO1xuICAgIGlmKCFjdXJyZW50U3VnZ2VzdGlvbkVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRvYyhjdXJyZW50U3VnZ2VzdGlvbkVsZW1lbnQpLmFkZENsYXNzKCdjdXJyZW50Jyk7XG5cbiAgICB2YXIgZWxlbWVudFJlY3QgPSBjdXJyZW50U3VnZ2VzdGlvbkVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICAgIHBhcmVudFJlY3QgPSBjdXJyZW50U3VnZ2VzdGlvbkVsZW1lbnQub2Zmc2V0UGFyZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgaWYoZWxlbWVudFJlY3QudG9wIDwgKHBhcmVudFJlY3QudG9wICsgY3VycmVudFN1Z2dlc3Rpb25FbGVtZW50LmNsaWVudEhlaWdodCkgfHwgZWxlbWVudFJlY3QuYm90dG9tID4gKHBhcmVudFJlY3QudG9wICsgY3VycmVudFN1Z2dlc3Rpb25FbGVtZW50Lm9mZnNldFBhcmVudC5jbGllbnRIZWlnaHQpKSB7XG4gICAgICAgIHNjcm9sbFRvKGN1cnJlbnRTdWdnZXN0aW9uRWxlbWVudCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW5kZXJQcmVkaWN0aW9ucyhpdGVtcywgcHJlZGljdHlQaWNrKXtcbiAgICBpZighcHJlZGljdHlQaWNrLnByZWRpY3Rpb25MaXN0RWxlbWVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYocHJlZGljdHlQaWNrLnByZWRpY3Rpb25MaXN0RWxlbWVudC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgcHJlZGljdHlQaWNrLmNsZWFyUHJlZGljdGlvbnMoKTtcbiAgICB9XG5cbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgaWYoIShpdGVtIGluIHByZWRpY3R5UGljay5pdGVtRWxlbWVudHMpKSB7XG4gICAgICAgICAgICBwcmVkaWN0eVBpY2suaXRlbUVsZW1lbnRzW2l0ZW1dID0gY3JlbCgnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6ICdwcmVkaWN0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgJ3R5cGUnOiAnYnV0dG9uJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcHJlZGljdHlQaWNrLml0ZW1FbGVtZW50c1tpdGVtXS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHByZWRpY3R5UGljay5fc3VnZ2VzdGlvbiA9IGl0ZW07XG4gICAgICAgICAgICAgICAgcHJlZGljdHlQaWNrLl9hY2NlcHRQcmVkaWN0aW9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZWRpY3R5UGljay5pdGVtRWxlbWVudHNbaXRlbV0uY2xhc3NOYW1lID0gJ3ByZWRpY3Rpb24nO1xuXG4gICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHByZWRpY3R5UGljay5pdGVtRWxlbWVudHNbaXRlbV0pO1xuICAgIH0pO1xuXG4gICAgcHJlZGljdHlQaWNrLnByZWRpY3Rpb25MaXN0RWxlbWVudC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG4gICAgdXBkYXRlQ3VycmVudFNlbGVjdGlvbihwcmVkaWN0eVBpY2spO1xufVxuXG5mdW5jdGlvbiBQcmVkaWN0eVBpY2soKXtcbiAgICBQcmVkaWN0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdmFyIHByZWRpY3R5UGljayA9IHRoaXM7XG4gICAgcHJlZGljdHlQaWNrLnJlbmRlcmVkRWxlbWVudCA9IGNyZWwoJ2RpdicsIHsnY2xhc3MnOiAncHJlZGljdHlQaWNrJ30pO1xuICAgIHByZWRpY3R5UGljay5pdGVtRWxlbWVudHMgPSB7fTtcblxuICAgIHByZWRpY3R5UGljay5vbigndmFsdWUnLCBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJlbmRlclByZWRpY3Rpb25zKHByZWRpY3R5UGljay5pdGVtcygpLCBwcmVkaWN0eVBpY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJlZGljdHlQaWNrLl9tYXRjaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHByZWRpY3R5UGljay5vbignaXRlbXMnLCBmdW5jdGlvbihpdGVtcyl7XG4gICAgICAgIHJlbmRlclByZWRpY3Rpb25zKGl0ZW1zLCBwcmVkaWN0eVBpY2spO1xuICAgIH0pO1xuXG4gICAgcHJlZGljdHlQaWNrLm9uKCdhY2NlcHQnLCBmdW5jdGlvbigpe1xuICAgICAgICBwcmVkaWN0eVBpY2suc3VnZ2VzdGlvbkVsZW1lbnQuaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgIHByZWRpY3R5UGljay5jbGVhclByZWRpY3Rpb25zKCk7XG4gICAgfSk7XG5cbiAgICBwcmVkaWN0eVBpY2sucmVuZGVyZWRFbGVtZW50LmFwcGVuZENoaWxkKHByZWRpY3R5UGljay5lbGVtZW50KTtcblxuICAgIHZhciBwcmVkaWN0aW9uTGlzdEVsZW1lbnQgPSBjcmVsKCdkaXYnLCB7J2NsYXNzJzogJ3ByZWRpY3Rpb25MaXN0J30pO1xuICAgIHByZWRpY3R5UGljay5wcmVkaWN0aW9uTGlzdEVsZW1lbnQgPSBwcmVkaWN0aW9uTGlzdEVsZW1lbnQ7XG5cbiAgICBwcmVkaWN0eVBpY2sucmVuZGVyZWRFbGVtZW50LmFwcGVuZENoaWxkKHByZWRpY3Rpb25MaXN0RWxlbWVudCk7XG4gICAgcHJlZGljdHlQaWNrLnJlbmRlcmVkRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG5vTWF0Y2hlZEl0ZW1zID0gcHJlZGljdHlQaWNrLm1hdGNoZWRJdGVtcy5sZW5ndGggPD0gMTtcblxuICAgICAgICBpZihldmVudC53aGljaCA9PT0gMTMpIHsgLy9lbnRlclxuICAgICAgICAgICAgaWYobm9NYXRjaGVkSXRlbXMgJiYgcHJlZGljdHlQaWNrLl9zdWdnZXN0aW9uID09IG51bGwpIHtcbiAgICAgICAgICAgICAgIHByZWRpY3R5UGljay5fc3VnZ2VzdGlvbiA9IHByZWRpY3R5UGljay5pbnB1dEVsZW1lbnQudmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByZWRpY3R5UGljay5fYWNjZXB0UHJlZGljdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobm9NYXRjaGVkSXRlbXMgJiYgcHJlZGljdHlQaWNrLml0ZW1zKCkubGVuZ3RoIDw9MSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHVwS2V5UHJlc3NlZCA9IGV2ZW50LndoaWNoID09PSAzOCxcbiAgICAgICAgICAgIGRvd25LZXlQcmVzc2VkID0gZXZlbnQud2hpY2ggPT09IDQwO1xuXG4gICAgICAgIGlmKCEoZG93bktleVByZXNzZWQgfHwgdXBLZXlQcmVzc2VkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIWV2ZW50Lm1ldGFLZXkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFyZW50RWxlbWVudCA9IHByZWRpY3R5UGljay5wcmVkaWN0aW9uTGlzdEVsZW1lbnQsXG4gICAgICAgICAgICBsaXN0TGVuZ3RoID0gcGFyZW50RWxlbWVudC5jaGlsZHJlbi5sZW5ndGgsXG4gICAgICAgICAgICBuZXh0SW5kZXgsXG4gICAgICAgICAgICBjdXJyZW50U3VnZ2VzdGlvbkluZGV4ID0gcHJlZGljdHlQaWNrLmN1cnJlbnRTdWdnZXN0aW9uSW5kZXgsXG4gICAgICAgICAgICBjdXJyZW50SW5kZXhTZXQgPSB0eXBlb2YgY3VycmVudFN1Z2dlc3Rpb25JbmRleCA9PT0gJ251bWJlcic7XG5cbiAgICAgICAgaWYoZG93bktleVByZXNzZWQpIHsgLy9kb3duXG4gICAgICAgICAgICBuZXh0SW5kZXggPSAgY3VycmVudEluZGV4U2V0ID8gY3VycmVudFN1Z2dlc3Rpb25JbmRleCArIDEgOiAwO1xuICAgICAgICAgICAgZG9jKHBhcmVudEVsZW1lbnQuY2hpbGRyZW5bY3VycmVudFN1Z2dlc3Rpb25JbmRleF0pLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICAgICBjdXJyZW50U3VnZ2VzdGlvbkluZGV4ID0gbmV4dEluZGV4ID4gbGlzdExlbmd0aCAtIDEgPyBsaXN0TGVuZ3RoIC0gMSA6IG5leHRJbmRleDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHVwS2V5UHJlc3NlZCkgeyAvL3VwXG4gICAgICAgICAgICBuZXh0SW5kZXggPSBjdXJyZW50SW5kZXhTZXQgPyBjdXJyZW50U3VnZ2VzdGlvbkluZGV4IC0gMSA6IGxpc3RMZW5ndGggLSAxO1xuICAgICAgICAgICAgZG9jKHBhcmVudEVsZW1lbnQuY2hpbGRyZW5bY3VycmVudFN1Z2dlc3Rpb25JbmRleF0pLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XG4gICAgICAgICAgICBjdXJyZW50U3VnZ2VzdGlvbkluZGV4ID0gbmV4dEluZGV4IDwgMCA/IDAgOiBuZXh0SW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY3VycmVudFZhbHVlID0gcHJlZGljdHlQaWNrLnZhbHVlKCk7XG5cbiAgICAgICAgdmFyIGl0ZW1zID0gcHJlZGljdHlQaWNrLm1hdGNoZWRJdGVtcy5sZW5ndGggPyBwcmVkaWN0eVBpY2subWF0Y2hlZEl0ZW1zIDogcHJlZGljdHlQaWNrLml0ZW1zKCk7XG5cbiAgICAgICAgaWYoY3VycmVudFN1Z2dlc3Rpb25JbmRleCA+IGl0ZW1zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGN1cnJlbnRTdWdnZXN0aW9uSW5kZXggPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJlZGljdHlQaWNrLmN1cnJlbnRTdWdnZXN0aW9uSW5kZXggPSBjdXJyZW50U3VnZ2VzdGlvbkluZGV4O1xuICAgICAgICBwcmVkaWN0eVBpY2suX3N1Z2dlc3Rpb24gPSBpdGVtc1tjdXJyZW50U3VnZ2VzdGlvbkluZGV4XTtcbiAgICAgICAgcHJlZGljdHlQaWNrLl91cGRhdGVTdWdnZXN0aW9uKGN1cnJlbnRWYWx1ZSwgcHJlZGljdHlQaWNrLl9zdWdnZXN0aW9uLnNsaWNlKGN1cnJlbnRWYWx1ZS5sZW5ndGgpKTtcbiAgICAgICAgdXBkYXRlQ3VycmVudFNlbGVjdGlvbihwcmVkaWN0eVBpY2spO1xuICAgIH0pO1xufVxuUHJlZGljdHlQaWNrLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByZWRpY3R5O1xuUHJlZGljdHlQaWNrLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUHJlZGljdHkucHJvdG90eXBlKTtcblByZWRpY3R5UGljay5wcm90b3R5cGUuY2xlYXJQcmVkaWN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJlZGljdHlQaWNrID0gdGhpcztcblxuICAgIGlmKCFwcmVkaWN0eVBpY2sucHJlZGljdGlvbkxpc3RFbGVtZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB3aGlsZShwcmVkaWN0eVBpY2sucHJlZGljdGlvbkxpc3RFbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgcHJlZGljdHlQaWNrLnByZWRpY3Rpb25MaXN0RWxlbWVudC5yZW1vdmVDaGlsZChwcmVkaWN0eVBpY2sucHJlZGljdGlvbkxpc3RFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgIH1cbn07XG5cblByZWRpY3R5UGljay5wcm90b3R5cGUuX21hdGNoID0gZnVuY3Rpb24gbWF0Y2godmFsdWUpe1xuICAgIHZhciBwcmVkaWN0eVBpY2sgPSB0aGlzO1xuXG4gICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtcygpO1xuICAgIHZhciBtYXRjaGVkSXRlbXMgPSBbXTtcblxuICAgIHByZWRpY3R5UGljay5jbGVhclByZWRpY3Rpb25zKCk7XG5cbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspe1xuICAgICAgICBpZih0aGlzLl9tYXRjaEl0ZW0odmFsdWUsIGl0ZW1zW2ldKSl7XG4gICAgICAgICAgICBtYXRjaGVkSXRlbXMucHVzaChpdGVtc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcmVkaWN0eVBpY2subWF0Y2hlZEl0ZW1zID0gbWF0Y2hlZEl0ZW1zO1xuXG4gICAgcmVuZGVyUHJlZGljdGlvbnMobWF0Y2hlZEl0ZW1zLCBwcmVkaWN0eVBpY2spO1xuXG4gICAgcmV0dXJuIG1hdGNoZWRJdGVtc1swXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJlZGljdHlQaWNrO1xuIiwiLy9Db3B5cmlnaHQgKEMpIDIwMTIgS29yeSBOdW5uXHJcblxyXG4vL1Blcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcblxyXG4vL1RoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG5cclxuLy9USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cclxuXHJcbi8qXHJcblxyXG4gICAgVGhpcyBjb2RlIGlzIG5vdCBmb3JtYXR0ZWQgZm9yIHJlYWRhYmlsaXR5LCBidXQgcmF0aGVyIHJ1bi1zcGVlZCBhbmQgdG8gYXNzaXN0IGNvbXBpbGVycy5cclxuXHJcbiAgICBIb3dldmVyLCB0aGUgY29kZSdzIGludGVudGlvbiBzaG91bGQgYmUgdHJhbnNwYXJlbnQuXHJcblxyXG4gICAgKioqIElFIFNVUFBPUlQgKioqXHJcblxyXG4gICAgSWYgeW91IHJlcXVpcmUgdGhpcyBsaWJyYXJ5IHRvIHdvcmsgaW4gSUU3LCBhZGQgdGhlIGZvbGxvd2luZyBhZnRlciBkZWNsYXJpbmcgY3JlbC5cclxuXHJcbiAgICB2YXIgdGVzdERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxyXG4gICAgICAgIHRlc3RMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XHJcblxyXG4gICAgdGVzdERpdi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2EnKTtcclxuICAgIHRlc3REaXZbJ2NsYXNzTmFtZSddICE9PSAnYScgPyBjcmVsLmF0dHJNYXBbJ2NsYXNzJ10gPSAnY2xhc3NOYW1lJzp1bmRlZmluZWQ7XHJcbiAgICB0ZXN0RGl2LnNldEF0dHJpYnV0ZSgnbmFtZScsJ2EnKTtcclxuICAgIHRlc3REaXZbJ25hbWUnXSAhPT0gJ2EnID8gY3JlbC5hdHRyTWFwWyduYW1lJ10gPSBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZSl7XHJcbiAgICAgICAgZWxlbWVudC5pZCA9IHZhbHVlO1xyXG4gICAgfTp1bmRlZmluZWQ7XHJcblxyXG5cclxuICAgIHRlc3RMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICdhJyk7XHJcbiAgICB0ZXN0TGFiZWxbJ2h0bWxGb3InXSAhPT0gJ2EnID8gY3JlbC5hdHRyTWFwWydmb3InXSA9ICdodG1sRm9yJzp1bmRlZmluZWQ7XHJcblxyXG5cclxuXHJcbiovXHJcblxyXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcclxuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKGZhY3RvcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByb290LmNyZWwgPSBmYWN0b3J5KCk7XHJcbiAgICB9XHJcbn0odGhpcywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGZuID0gJ2Z1bmN0aW9uJyxcclxuICAgICAgICBvYmogPSAnb2JqZWN0JyxcclxuICAgICAgICBub2RlVHlwZSA9ICdub2RlVHlwZScsXHJcbiAgICAgICAgdGV4dENvbnRlbnQgPSAndGV4dENvbnRlbnQnLFxyXG4gICAgICAgIHNldEF0dHJpYnV0ZSA9ICdzZXRBdHRyaWJ1dGUnLFxyXG4gICAgICAgIGF0dHJNYXBTdHJpbmcgPSAnYXR0ck1hcCcsXHJcbiAgICAgICAgaXNOb2RlU3RyaW5nID0gJ2lzTm9kZScsXHJcbiAgICAgICAgaXNFbGVtZW50U3RyaW5nID0gJ2lzRWxlbWVudCcsXHJcbiAgICAgICAgZCA9IHR5cGVvZiBkb2N1bWVudCA9PT0gb2JqID8gZG9jdW1lbnQgOiB7fSxcclxuICAgICAgICBpc1R5cGUgPSBmdW5jdGlvbihhLCB0eXBlKXtcclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBhID09PSB0eXBlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXNOb2RlID0gdHlwZW9mIE5vZGUgPT09IGZuID8gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgTm9kZTtcclxuICAgICAgICB9IDpcclxuICAgICAgICAvLyBpbiBJRSA8PSA4IE5vZGUgaXMgYW4gb2JqZWN0LCBvYnZpb3VzbHkuLlxyXG4gICAgICAgIGZ1bmN0aW9uKG9iamVjdCl7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmplY3QgJiZcclxuICAgICAgICAgICAgICAgIGlzVHlwZShvYmplY3QsIG9iaikgJiZcclxuICAgICAgICAgICAgICAgIChub2RlVHlwZSBpbiBvYmplY3QpICYmXHJcbiAgICAgICAgICAgICAgICBpc1R5cGUob2JqZWN0Lm93bmVyRG9jdW1lbnQsb2JqKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGlzRWxlbWVudCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNyZWxbaXNOb2RlU3RyaW5nXShvYmplY3QpICYmIG9iamVjdFtub2RlVHlwZV0gPT09IDE7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpc0FycmF5ID0gZnVuY3Rpb24oYSl7XHJcbiAgICAgICAgICAgIHJldHVybiBhIGluc3RhbmNlb2YgQXJyYXk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhcHBlbmRDaGlsZCA9IGZ1bmN0aW9uKGVsZW1lbnQsIGNoaWxkKSB7XHJcbiAgICAgICAgICBpZighY3JlbFtpc05vZGVTdHJpbmddKGNoaWxkKSl7XHJcbiAgICAgICAgICAgICAgY2hpbGQgPSBkLmNyZWF0ZVRleHROb2RlKGNoaWxkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGNyZWwoKXtcclxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cywgLy9Ob3RlOiBhc3NpZ25lZCB0byBhIHZhcmlhYmxlIHRvIGFzc2lzdCBjb21waWxlcnMuIFNhdmVzIGFib3V0IDQwIGJ5dGVzIGluIGNsb3N1cmUgY29tcGlsZXIuIEhhcyBuZWdsaWdhYmxlIGVmZmVjdCBvbiBwZXJmb3JtYW5jZS5cclxuICAgICAgICAgICAgZWxlbWVudCA9IGFyZ3NbMF0sXHJcbiAgICAgICAgICAgIGNoaWxkLFxyXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGFyZ3NbMV0sXHJcbiAgICAgICAgICAgIGNoaWxkSW5kZXggPSAyLFxyXG4gICAgICAgICAgICBhcmd1bWVudHNMZW5ndGggPSBhcmdzLmxlbmd0aCxcclxuICAgICAgICAgICAgYXR0cmlidXRlTWFwID0gY3JlbFthdHRyTWFwU3RyaW5nXTtcclxuXHJcbiAgICAgICAgZWxlbWVudCA9IGNyZWxbaXNFbGVtZW50U3RyaW5nXShlbGVtZW50KSA/IGVsZW1lbnQgOiBkLmNyZWF0ZUVsZW1lbnQoZWxlbWVudCk7XHJcbiAgICAgICAgLy8gc2hvcnRjdXRcclxuICAgICAgICBpZihhcmd1bWVudHNMZW5ndGggPT09IDEpe1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCFpc1R5cGUoc2V0dGluZ3Msb2JqKSB8fCBjcmVsW2lzTm9kZVN0cmluZ10oc2V0dGluZ3MpIHx8IGlzQXJyYXkoc2V0dGluZ3MpKSB7XHJcbiAgICAgICAgICAgIC0tY2hpbGRJbmRleDtcclxuICAgICAgICAgICAgc2V0dGluZ3MgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2hvcnRjdXQgaWYgdGhlcmUgaXMgb25seSBvbmUgY2hpbGQgdGhhdCBpcyBhIHN0cmluZ1xyXG4gICAgICAgIGlmKChhcmd1bWVudHNMZW5ndGggLSBjaGlsZEluZGV4KSA9PT0gMSAmJiBpc1R5cGUoYXJnc1tjaGlsZEluZGV4XSwgJ3N0cmluZycpICYmIGVsZW1lbnRbdGV4dENvbnRlbnRdICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBlbGVtZW50W3RleHRDb250ZW50XSA9IGFyZ3NbY2hpbGRJbmRleF07XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZvcig7IGNoaWxkSW5kZXggPCBhcmd1bWVudHNMZW5ndGg7ICsrY2hpbGRJbmRleCl7XHJcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGFyZ3NbY2hpbGRJbmRleF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoY2hpbGQgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkoY2hpbGQpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGNoaWxkLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kQ2hpbGQoZWxlbWVudCwgY2hpbGRbaV0pO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBhcHBlbmRDaGlsZChlbGVtZW50LCBjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvcih2YXIga2V5IGluIHNldHRpbmdzKXtcclxuICAgICAgICAgICAgaWYoIWF0dHJpYnV0ZU1hcFtrZXldKXtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnRbc2V0QXR0cmlidXRlXShrZXksIHNldHRpbmdzW2tleV0pO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gYXR0cmlidXRlTWFwW2tleV07XHJcbiAgICAgICAgICAgICAgICBpZih0eXBlb2YgYXR0ciA9PT0gZm4pe1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIoZWxlbWVudCwgc2V0dGluZ3Nba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50W3NldEF0dHJpYnV0ZV0oYXR0ciwgc2V0dGluZ3Nba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVzZWQgZm9yIG1hcHBpbmcgb25lIGtpbmQgb2YgYXR0cmlidXRlIHRvIHRoZSBzdXBwb3J0ZWQgdmVyc2lvbiBvZiB0aGF0IGluIGJhZCBicm93c2Vycy5cclxuICAgIGNyZWxbYXR0ck1hcFN0cmluZ10gPSB7fTtcclxuXHJcbiAgICBjcmVsW2lzRWxlbWVudFN0cmluZ10gPSBpc0VsZW1lbnQ7XHJcblxyXG4gICAgY3JlbFtpc05vZGVTdHJpbmddID0gaXNOb2RlO1xyXG5cclxuICAgIHJldHVybiBjcmVsO1xyXG59KSk7XHJcbiIsInZhciBkb2MgPSB7XHJcbiAgICBkb2N1bWVudDogdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50IDogbnVsbCxcclxuICAgIHNldERvY3VtZW50OiBmdW5jdGlvbihkKXtcclxuICAgICAgICB0aGlzLmRvY3VtZW50ID0gZDtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBhcnJheVByb3RvID0gW10sXHJcbiAgICBpc0xpc3QgPSByZXF1aXJlKCcuL2lzTGlzdCcpLFxyXG4gICAgZ2V0VGFyZ2V0cyA9IHJlcXVpcmUoJy4vZ2V0VGFyZ2V0cycpKGRvYy5kb2N1bWVudCksXHJcbiAgICBnZXRUYXJnZXQgPSByZXF1aXJlKCcuL2dldFRhcmdldCcpKGRvYy5kb2N1bWVudCksXHJcbiAgICBzcGFjZSA9ICcgJztcclxuXHJcblxyXG4vLy9bUkVBRE1FLm1kXVxyXG5cclxuZnVuY3Rpb24gaXNJbihhcnJheSwgaXRlbSl7XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZihpdGVtID09PSBhcnJheVtpXSl7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcblxyXG4gICAgIyMgLmZpbmRcclxuXHJcbiAgICBmaW5kcyBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBxdWVyeSB3aXRoaW4gdGhlIHNjb3BlIG9mIHRhcmdldFxyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYyh0YXJnZXQpLmZpbmQocXVlcnkpO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5maW5kKHRhcmdldCwgcXVlcnkpO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gZmluZCh0YXJnZXQsIHF1ZXJ5KXtcclxuICAgIHRhcmdldCA9IGdldFRhcmdldHModGFyZ2V0KTtcclxuICAgIGlmKHF1ZXJ5ID09IG51bGwpe1xyXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YXJnZXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHN1YlJlc3VsdHMgPSBkb2MuZmluZCh0YXJnZXRbaV0sIHF1ZXJ5KTtcclxuICAgICAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IHN1YlJlc3VsdHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGlmKCFpc0luKHJlc3VsdHMsIHN1YlJlc3VsdHNbal0pKXtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goc3ViUmVzdWx0c1tqXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldCA/IHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSA6IFtdO1xyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAuZmluZE9uZVxyXG5cclxuICAgIGZpbmRzIHRoZSBmaXJzdCBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgcXVlcnkgd2l0aGluIHRoZSBzY29wZSBvZiB0YXJnZXRcclxuXHJcbiAgICAgICAgLy9mbHVlbnRcclxuICAgICAgICBkb2ModGFyZ2V0KS5maW5kT25lKHF1ZXJ5KTtcclxuXHJcbiAgICAgICAgLy9sZWdhY3lcclxuICAgICAgICBkb2MuZmluZE9uZSh0YXJnZXQsIHF1ZXJ5KTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIGZpbmRPbmUodGFyZ2V0LCBxdWVyeSl7XHJcbiAgICB0YXJnZXQgPSBnZXRUYXJnZXQodGFyZ2V0KTtcclxuICAgIGlmKHF1ZXJ5ID09IG51bGwpe1xyXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIHZhciByZXN1bHQ7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YXJnZXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZmluZE9uZSh0YXJnZXRbaV0sIHF1ZXJ5KTtcclxuICAgICAgICAgICAgaWYocmVzdWx0KXtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldCA/IHRhcmdldC5xdWVyeVNlbGVjdG9yKHF1ZXJ5KSA6IG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG5cclxuICAgICMjIC5jbG9zZXN0XHJcblxyXG4gICAgcmVjdXJzZXMgdXAgdGhlIERPTSBmcm9tIHRoZSB0YXJnZXQgbm9kZSwgY2hlY2tpbmcgaWYgdGhlIGN1cnJlbnQgZWxlbWVudCBtYXRjaGVzIHRoZSBxdWVyeVxyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYyh0YXJnZXQpLmNsb3Nlc3QocXVlcnkpO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5jbG9zZXN0KHRhcmdldCwgcXVlcnkpO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gY2xvc2VzdCh0YXJnZXQsIHF1ZXJ5KXtcclxuICAgIHRhcmdldCA9IGdldFRhcmdldCh0YXJnZXQpO1xyXG5cclxuICAgIGlmKGlzTGlzdCh0YXJnZXQpKXtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXRbMF07XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUoXHJcbiAgICAgICAgdGFyZ2V0ICYmXHJcbiAgICAgICAgdGFyZ2V0Lm93bmVyRG9jdW1lbnQgJiZcclxuICAgICAgICAhaXModGFyZ2V0LCBxdWVyeSlcclxuICAgICl7XHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldCA9PT0gZG9jLmRvY3VtZW50ICYmIHRhcmdldCAhPT0gcXVlcnkgPyBudWxsIDogdGFyZ2V0O1xyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAuaXNcclxuXHJcbiAgICByZXR1cm5zIHRydWUgaWYgdGhlIHRhcmdldCBlbGVtZW50IG1hdGNoZXMgdGhlIHF1ZXJ5XHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKHRhcmdldCkuaXMocXVlcnkpO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5pcyh0YXJnZXQsIHF1ZXJ5KTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIGlzKHRhcmdldCwgcXVlcnkpe1xyXG4gICAgdGFyZ2V0ID0gZ2V0VGFyZ2V0KHRhcmdldCk7XHJcblxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIHRhcmdldCA9IHRhcmdldFswXTtcclxuICAgIH1cclxuXHJcbiAgICBpZighdGFyZ2V0Lm93bmVyRG9jdW1lbnQgfHwgdHlwZW9mIHF1ZXJ5ICE9PSAnc3RyaW5nJyl7XHJcbiAgICAgICAgcmV0dXJuIHRhcmdldCA9PT0gcXVlcnk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYodGFyZ2V0ID09PSBxdWVyeSl7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHBhcmVudGxlc3MgPSAhdGFyZ2V0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgaWYocGFyZW50bGVzcyl7XHJcbiAgICAgICAgLy8gR2l2ZSB0aGUgZWxlbWVudCBhIHBhcmVudCBzbyB0aGF0IC5xdWVyeVNlbGVjdG9yQWxsIGNhbiBiZSB1c2VkXHJcbiAgICAgICAgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLmFwcGVuZENoaWxkKHRhcmdldCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJlc3VsdCA9IGFycmF5UHJvdG8uaW5kZXhPZi5jYWxsKGZpbmQodGFyZ2V0LnBhcmVudE5vZGUsIHF1ZXJ5KSwgdGFyZ2V0KSA+PSAwO1xyXG5cclxuICAgIGlmKHBhcmVudGxlc3Mpe1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRhcmdldCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcblxyXG4gICAgIyMgLmFkZENsYXNzXHJcblxyXG4gICAgYWRkcyBjbGFzc2VzIHRvIHRoZSB0YXJnZXQgKHNwYWNlIHNlcGFyYXRlZCBzdHJpbmcgb3IgYXJyYXkpXHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKHRhcmdldCkuYWRkQ2xhc3MocXVlcnkpO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5hZGRDbGFzcyh0YXJnZXQsIHF1ZXJ5KTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIGFkZENsYXNzKHRhcmdldCwgY2xhc3Nlcyl7XHJcbiAgICB0YXJnZXQgPSBnZXRUYXJnZXRzKHRhcmdldCk7XHJcblxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFyZ2V0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFkZENsYXNzKHRhcmdldFtpXSwgY2xhc3Nlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgaWYoIWNsYXNzZXMpe1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjbGFzc2VzID0gQXJyYXkuaXNBcnJheShjbGFzc2VzKSA/IGNsYXNzZXMgOiBjbGFzc2VzLnNwbGl0KHNwYWNlKSxcclxuICAgICAgICBjdXJyZW50Q2xhc3NlcyA9IHRhcmdldC5jbGFzc0xpc3QgPyBudWxsIDogdGFyZ2V0LmNsYXNzTmFtZS5zcGxpdChzcGFjZSk7XHJcblxyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIHZhciBjbGFzc1RvQWRkID0gY2xhc3Nlc1tpXTtcclxuICAgICAgICBpZighY2xhc3NUb0FkZCB8fCBjbGFzc1RvQWRkID09PSBzcGFjZSl7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0YXJnZXQuY2xhc3NMaXN0KXtcclxuICAgICAgICAgICAgdGFyZ2V0LmNsYXNzTGlzdC5hZGQoY2xhc3NUb0FkZCk7XHJcbiAgICAgICAgfSBlbHNlIGlmKCFjdXJyZW50Q2xhc3Nlcy5pbmRleE9mKGNsYXNzVG9BZGQpPj0wKXtcclxuICAgICAgICAgICAgY3VycmVudENsYXNzZXMucHVzaChjbGFzc1RvQWRkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZighdGFyZ2V0LmNsYXNzTGlzdCl7XHJcbiAgICAgICAgdGFyZ2V0LmNsYXNzTmFtZSA9IGN1cnJlbnRDbGFzc2VzLmpvaW4oc3BhY2UpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbi8qKlxyXG5cclxuICAgICMjIC5yZW1vdmVDbGFzc1xyXG5cclxuICAgIHJlbW92ZXMgY2xhc3NlcyBmcm9tIHRoZSB0YXJnZXQgKHNwYWNlIHNlcGFyYXRlZCBzdHJpbmcgb3IgYXJyYXkpXHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKHRhcmdldCkucmVtb3ZlQ2xhc3MocXVlcnkpO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5yZW1vdmVDbGFzcyh0YXJnZXQsIHF1ZXJ5KTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKHRhcmdldCwgY2xhc3Nlcyl7XHJcbiAgICB0YXJnZXQgPSBnZXRUYXJnZXRzKHRhcmdldCk7XHJcblxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFyZ2V0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzKHRhcmdldFtpXSwgY2xhc3Nlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCFjbGFzc2VzKXtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY2xhc3NlcyA9IEFycmF5LmlzQXJyYXkoY2xhc3NlcykgPyBjbGFzc2VzIDogY2xhc3Nlcy5zcGxpdChzcGFjZSksXHJcbiAgICAgICAgY3VycmVudENsYXNzZXMgPSB0YXJnZXQuY2xhc3NMaXN0ID8gbnVsbCA6IHRhcmdldC5jbGFzc05hbWUuc3BsaXQoc3BhY2UpO1xyXG5cclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICB2YXIgY2xhc3NUb1JlbW92ZSA9IGNsYXNzZXNbaV07XHJcbiAgICAgICAgaWYoIWNsYXNzVG9SZW1vdmUgfHwgY2xhc3NUb1JlbW92ZSA9PT0gc3BhY2Upe1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGFyZ2V0LmNsYXNzTGlzdCl7XHJcbiAgICAgICAgICAgIHRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzVG9SZW1vdmUpO1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlbW92ZUluZGV4ID0gY3VycmVudENsYXNzZXMuaW5kZXhPZihjbGFzc1RvUmVtb3ZlKTtcclxuICAgICAgICBpZihyZW1vdmVJbmRleCA+PSAwKXtcclxuICAgICAgICAgICAgY3VycmVudENsYXNzZXMuc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZighdGFyZ2V0LmNsYXNzTGlzdCl7XHJcbiAgICAgICAgdGFyZ2V0LmNsYXNzTmFtZSA9IGN1cnJlbnRDbGFzc2VzLmpvaW4oc3BhY2UpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZEV2ZW50KHNldHRpbmdzKXtcclxuICAgIHZhciB0YXJnZXQgPSBnZXRUYXJnZXQoc2V0dGluZ3MudGFyZ2V0KTtcclxuICAgIGlmKHRhcmdldCl7XHJcbiAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoc2V0dGluZ3MuZXZlbnQsIHNldHRpbmdzLmNhbGxiYWNrLCBmYWxzZSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ05vIGVsZW1lbnRzIG1hdGNoZWQgdGhlIHNlbGVjdG9yLCBzbyBubyBldmVudHMgd2VyZSBib3VuZC4nKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcblxyXG4gICAgIyMgLm9uXHJcblxyXG4gICAgYmluZHMgYSBjYWxsYmFjayB0byBhIHRhcmdldCB3aGVuIGEgRE9NIGV2ZW50IGlzIHJhaXNlZC5cclxuXHJcbiAgICAgICAgLy9mbHVlbnRcclxuICAgICAgICBkb2ModGFyZ2V0L3Byb3h5KS5vbihldmVudHMsIHRhcmdldFtvcHRpb25hbF0sIGNhbGxiYWNrKTtcclxuXHJcbiAgICBub3RlOiBpZiBhIHRhcmdldCBpcyBwYXNzZWQgdG8gdGhlIC5vbiBmdW5jdGlvbiwgZG9jJ3MgdGFyZ2V0IHdpbGwgYmUgdXNlZCBhcyB0aGUgcHJveHkuXHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLm9uKGV2ZW50cywgdGFyZ2V0LCBxdWVyeSwgcHJveHlbb3B0aW9uYWxdKTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIG9uKGV2ZW50cywgdGFyZ2V0LCBjYWxsYmFjaywgcHJveHkpe1xyXG5cclxuICAgIHByb3h5ID0gZ2V0VGFyZ2V0cyhwcm94eSk7XHJcblxyXG4gICAgaWYoIXByb3h5KXtcclxuICAgICAgICB0YXJnZXQgPSBnZXRUYXJnZXRzKHRhcmdldCk7XHJcbiAgICAgICAgLy8gaGFuZGxlcyBtdWx0aXBsZSB0YXJnZXRzXHJcbiAgICAgICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgICAgICB2YXIgbXVsdGlSZW1vdmVDYWxsYmFja3MgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YXJnZXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIG11bHRpUmVtb3ZlQ2FsbGJhY2tzLnB1c2gob24oZXZlbnRzLCB0YXJnZXRbaV0sIGNhbGxiYWNrLCBwcm94eSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgd2hpbGUobXVsdGlSZW1vdmVDYWxsYmFja3MubGVuZ3RoKXtcclxuICAgICAgICAgICAgICAgICAgICBtdWx0aVJlbW92ZUNhbGxiYWNrcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaGFuZGxlcyBtdWx0aXBsZSBwcm94aWVzXHJcbiAgICAvLyBBbHJlYWR5IGhhbmRsZXMgbXVsdGlwbGUgcHJveGllcyBhbmQgdGFyZ2V0cyxcclxuICAgIC8vIGJlY2F1c2UgdGhlIHRhcmdldCBsb29wIGNhbGxzIHRoaXMgbG9vcC5cclxuICAgIGlmKGlzTGlzdChwcm94eSkpe1xyXG4gICAgICAgIHZhciBtdWx0aVJlbW92ZUNhbGxiYWNrcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJveHkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbXVsdGlSZW1vdmVDYWxsYmFja3MucHVzaChvbihldmVudHMsIHRhcmdldCwgY2FsbGJhY2ssIHByb3h5W2ldKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB3aGlsZShtdWx0aVJlbW92ZUNhbGxiYWNrcy5sZW5ndGgpe1xyXG4gICAgICAgICAgICAgICAgbXVsdGlSZW1vdmVDYWxsYmFja3MucG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByZW1vdmVDYWxsYmFja3MgPSBbXTtcclxuXHJcbiAgICBpZih0eXBlb2YgZXZlbnRzID09PSAnc3RyaW5nJyl7XHJcbiAgICAgICAgZXZlbnRzID0gZXZlbnRzLnNwbGl0KHNwYWNlKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICB2YXIgZXZlbnRTZXR0aW5ncyA9IHt9O1xyXG4gICAgICAgIGlmKHByb3h5KXtcclxuICAgICAgICAgICAgaWYocHJveHkgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgICAgcHJveHkgPSBkb2MuZG9jdW1lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZXZlbnRTZXR0aW5ncy50YXJnZXQgPSBwcm94eTtcclxuICAgICAgICAgICAgZXZlbnRTZXR0aW5ncy5jYWxsYmFjayA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgICAgICAgIHZhciBjbG9zZXN0VGFyZ2V0ID0gY2xvc2VzdChldmVudC50YXJnZXQsIHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICBpZihjbG9zZXN0VGFyZ2V0KXtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhldmVudCwgY2xvc2VzdFRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGV2ZW50U2V0dGluZ3MudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgICAgICAgICBldmVudFNldHRpbmdzLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBldmVudFNldHRpbmdzLmV2ZW50ID0gZXZlbnRzW2ldO1xyXG5cclxuICAgICAgICBhZGRFdmVudChldmVudFNldHRpbmdzKTtcclxuXHJcbiAgICAgICAgcmVtb3ZlQ2FsbGJhY2tzLnB1c2goZXZlbnRTZXR0aW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgd2hpbGUocmVtb3ZlQ2FsbGJhY2tzLmxlbmd0aCl7XHJcbiAgICAgICAgICAgIHZhciByZW1vdmVDYWxsYmFjayA9IHJlbW92ZUNhbGxiYWNrcy5wb3AoKTtcclxuICAgICAgICAgICAgZ2V0VGFyZ2V0KHJlbW92ZUNhbGxiYWNrLnRhcmdldCkucmVtb3ZlRXZlbnRMaXN0ZW5lcihyZW1vdmVDYWxsYmFjay5ldmVudCwgcmVtb3ZlQ2FsbGJhY2suY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcblxyXG4gICAgIyMgLm9mZlxyXG5cclxuICAgIHJlbW92ZXMgZXZlbnRzIGFzc2lnbmVkIHRvIGEgdGFyZ2V0LlxyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYyh0YXJnZXQvcHJveHkpLm9mZihldmVudHMsIHRhcmdldFtvcHRpb25hbF0sIGNhbGxiYWNrKTtcclxuXHJcbiAgICBub3RlOiBpZiBhIHRhcmdldCBpcyBwYXNzZWQgdG8gdGhlIC5vbiBmdW5jdGlvbiwgZG9jJ3MgdGFyZ2V0IHdpbGwgYmUgdXNlZCBhcyB0aGUgcHJveHkuXHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLm9mZihldmVudHMsIHRhcmdldCwgY2FsbGJhY2ssIHByb3h5KTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIG9mZihldmVudHMsIHRhcmdldCwgY2FsbGJhY2ssIHByb3h5KXtcclxuICAgIGlmKGlzTGlzdCh0YXJnZXQpKXtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhcmdldC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBvZmYoZXZlbnRzLCB0YXJnZXRbaV0sIGNhbGxiYWNrLCBwcm94eSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgaWYocHJveHkgaW5zdGFuY2VvZiBBcnJheSl7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm94eS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBvZmYoZXZlbnRzLCB0YXJnZXQsIGNhbGxiYWNrLCBwcm94eVtpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHR5cGVvZiBldmVudHMgPT09ICdzdHJpbmcnKXtcclxuICAgICAgICBldmVudHMgPSBldmVudHMuc3BsaXQoc3BhY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJyl7XHJcbiAgICAgICAgcHJveHkgPSBjYWxsYmFjaztcclxuICAgICAgICBjYWxsYmFjayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJveHkgPSBwcm94eSA/IGdldFRhcmdldChwcm94eSkgOiBkb2MuZG9jdW1lbnQ7XHJcblxyXG4gICAgdmFyIHRhcmdldHMgPSB0eXBlb2YgdGFyZ2V0ID09PSAnc3RyaW5nJyA/IGZpbmQodGFyZ2V0LCBwcm94eSkgOiBbdGFyZ2V0XTtcclxuXHJcbiAgICBmb3IodmFyIHRhcmdldEluZGV4ID0gMDsgdGFyZ2V0SW5kZXggPCB0YXJnZXRzLmxlbmd0aDsgdGFyZ2V0SW5kZXgrKyl7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUYXJnZXQgPSB0YXJnZXRzW3RhcmdldEluZGV4XTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGV2ZW50cy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGN1cnJlbnRUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudHNbaV0sIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuLyoqXHJcblxyXG4gICAgIyMgLmFwcGVuZFxyXG5cclxuICAgIGFkZHMgZWxlbWVudHMgdG8gYSB0YXJnZXRcclxuXHJcbiAgICAgICAgLy9mbHVlbnRcclxuICAgICAgICBkb2ModGFyZ2V0KS5hcHBlbmQoY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5hcHBlbmQodGFyZ2V0LCBjaGlsZHJlbik7XHJcbiovXHJcblxyXG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBjaGlsZHJlbil7XHJcbiAgICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0KHRhcmdldCksXHJcbiAgICAgICAgY2hpbGRyZW4gPSBnZXRUYXJnZXQoY2hpbGRyZW4pO1xyXG5cclxuICAgIGlmKGlzTGlzdCh0YXJnZXQpKXtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXRbMF07XHJcbiAgICB9XHJcblxyXG4gICAgaWYoaXNMaXN0KGNoaWxkcmVuKSl7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBhcHBlbmQodGFyZ2V0LCBjaGlsZHJlbltpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoY2hpbGRyZW4pO1xyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAucHJlcGVuZFxyXG5cclxuICAgIGFkZHMgZWxlbWVudHMgdG8gdGhlIGZyb250IG9mIGEgdGFyZ2V0XHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKHRhcmdldCkucHJlcGVuZChjaGlsZHJlbik7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLnByZXBlbmQodGFyZ2V0LCBjaGlsZHJlbik7XHJcbiovXHJcblxyXG5mdW5jdGlvbiBwcmVwZW5kKHRhcmdldCwgY2hpbGRyZW4pe1xyXG4gICAgdmFyIHRhcmdldCA9IGdldFRhcmdldCh0YXJnZXQpLFxyXG4gICAgICAgIGNoaWxkcmVuID0gZ2V0VGFyZ2V0KGNoaWxkcmVuKTtcclxuXHJcbiAgICBpZihpc0xpc3QodGFyZ2V0KSl7XHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0WzBdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKGlzTGlzdChjaGlsZHJlbikpe1xyXG4gICAgICAgIC8vcmV2ZXJzZWQgYmVjYXVzZSBvdGhlcndpc2UgdGhlIHdvdWxkIGdldCBwdXQgaW4gaW4gdGhlIHdyb25nIG9yZGVyLlxyXG4gICAgICAgIGZvciAodmFyIGkgPSBjaGlsZHJlbi5sZW5ndGggLTE7IGk7IGktLSkge1xyXG4gICAgICAgICAgICBwcmVwZW5kKHRhcmdldCwgY2hpbGRyZW5baV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShjaGlsZHJlbiwgdGFyZ2V0LmZpcnN0Q2hpbGQpO1xyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAuaXNWaXNpYmxlXHJcblxyXG4gICAgY2hlY2tzIGlmIGFuIGVsZW1lbnQgb3IgYW55IG9mIGl0cyBwYXJlbnRzIGRpc3BsYXkgcHJvcGVydGllcyBhcmUgc2V0IHRvICdub25lJ1xyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYyh0YXJnZXQpLmlzVmlzaWJsZSgpO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5pc1Zpc2libGUodGFyZ2V0KTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIGlzVmlzaWJsZSh0YXJnZXQpe1xyXG4gICAgdmFyIHRhcmdldCA9IGdldFRhcmdldCh0YXJnZXQpO1xyXG4gICAgaWYoIXRhcmdldCl7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIHZhciBpID0gLTE7XHJcblxyXG4gICAgICAgIHdoaWxlICh0YXJnZXRbaSsrXSAmJiBpc1Zpc2libGUodGFyZ2V0W2ldKSkge31cclxuICAgICAgICByZXR1cm4gdGFyZ2V0Lmxlbmd0aCA+PSBpO1xyXG4gICAgfVxyXG4gICAgd2hpbGUodGFyZ2V0LnBhcmVudE5vZGUgJiYgdGFyZ2V0LnN0eWxlLmRpc3BsYXkgIT09ICdub25lJyl7XHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldCA9PT0gZG9jLmRvY3VtZW50O1xyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAuaW5kZXhPZkVsZW1lbnRcclxuXHJcbiAgICByZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB3aXRoaW4gaXQncyBwYXJlbnQgZWxlbWVudC5cclxuXHJcbiAgICAgICAgLy9mbHVlbnRcclxuICAgICAgICBkb2ModGFyZ2V0KS5pbmRleE9mRWxlbWVudCgpO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5pbmRleE9mRWxlbWVudCh0YXJnZXQpO1xyXG5cclxuKi9cclxuXHJcbmZ1bmN0aW9uIGluZGV4T2ZFbGVtZW50KHRhcmdldCkge1xyXG4gICAgdGFyZ2V0ID0gZ2V0VGFyZ2V0cyh0YXJnZXQpO1xyXG4gICAgaWYoIXRhcmdldCl7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKGlzTGlzdCh0YXJnZXQpKXtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXRbMF07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGkgPSAtMTtcclxuXHJcbiAgICB2YXIgcGFyZW50ID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ7XHJcblxyXG4gICAgaWYoIXBhcmVudCl7XHJcbiAgICAgICAgcmV0dXJuIGk7XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUocGFyZW50LmNoaWxkcmVuWysraV0gIT09IHRhcmdldCl7fVxyXG5cclxuICAgIHJldHVybiBpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcblxyXG4gICAgIyMgLnJlYWR5XHJcblxyXG4gICAgY2FsbCBhIGNhbGxiYWNrIHdoZW4gdGhlIGRvY3VtZW50IGlzIHJlYWR5LlxyXG5cclxuICAgIHJldHVybnMgLTEgaWYgdGhlcmUgaXMgbm8gcGFyZW50RWxlbWVudCBvbiB0aGUgdGFyZ2V0LlxyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYygpLnJlYWR5KGNhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgLy9sZWdhY3lcclxuICAgICAgICBkb2MucmVhZHkoY2FsbGJhY2spO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gcmVhZHkoY2FsbGJhY2spe1xyXG4gICAgaWYoZG9jLmRvY3VtZW50ICYmIChkb2MuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJyB8fCBkb2MuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykpe1xyXG4gICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICB9ZWxzZSBpZih3aW5kb3cuYXR0YWNoRXZlbnQpe1xyXG4gICAgICAgIGRvY3VtZW50LmF0dGFjaEV2ZW50KFwib25yZWFkeXN0YXRlY2hhbmdlXCIsIGNhbGxiYWNrKTtcclxuICAgICAgICB3aW5kb3cuYXR0YWNoRXZlbnQoXCJvbkxvYWRcIixjYWxsYmFjayk7XHJcbiAgICB9ZWxzZSBpZihkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKXtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLGNhbGxiYWNrLGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZG9jLmZpbmQgPSBmaW5kO1xyXG5kb2MuZmluZE9uZSA9IGZpbmRPbmU7XHJcbmRvYy5jbG9zZXN0ID0gY2xvc2VzdDtcclxuZG9jLmlzID0gaXM7XHJcbmRvYy5hZGRDbGFzcyA9IGFkZENsYXNzO1xyXG5kb2MucmVtb3ZlQ2xhc3MgPSByZW1vdmVDbGFzcztcclxuZG9jLm9mZiA9IG9mZjtcclxuZG9jLm9uID0gb247XHJcbmRvYy5hcHBlbmQgPSBhcHBlbmQ7XHJcbmRvYy5wcmVwZW5kID0gcHJlcGVuZDtcclxuZG9jLmlzVmlzaWJsZSA9IGlzVmlzaWJsZTtcclxuZG9jLnJlYWR5ID0gcmVhZHk7XHJcbmRvYy5pbmRleE9mRWxlbWVudCA9IGluZGV4T2ZFbGVtZW50O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBkb2M7IiwidmFyIGRvYyA9IHJlcXVpcmUoJy4vZG9jJyksXHJcbiAgICBpc0xpc3QgPSByZXF1aXJlKCcuL2lzTGlzdCcpLFxyXG4gICAgZ2V0VGFyZ2V0cyA9IHJlcXVpcmUoJy4vZ2V0VGFyZ2V0cycpKGRvYy5kb2N1bWVudCksXHJcbiAgICBmbG9jUHJvdG8gPSBbXTtcclxuXHJcbmZ1bmN0aW9uIEZsb2MoaXRlbXMpe1xyXG4gICAgdGhpcy5wdXNoLmFwcGx5KHRoaXMsIGl0ZW1zKTtcclxufVxyXG5GbG9jLnByb3RvdHlwZSA9IGZsb2NQcm90bztcclxuZmxvY1Byb3RvLmNvbnN0cnVjdG9yID0gRmxvYztcclxuXHJcbmZ1bmN0aW9uIGZsb2ModGFyZ2V0KXtcclxuICAgIHZhciBpbnN0YW5jZSA9IGdldFRhcmdldHModGFyZ2V0KTtcclxuXHJcbiAgICBpZighaXNMaXN0KGluc3RhbmNlKSl7XHJcbiAgICAgICAgaWYoaW5zdGFuY2Upe1xyXG4gICAgICAgICAgICBpbnN0YW5jZSA9IFtpbnN0YW5jZV07XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGluc3RhbmNlID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBGbG9jKGluc3RhbmNlKTtcclxufVxyXG5cclxudmFyIHJldHVybnNTZWxmID0gJ2FkZENsYXNzIHJlbW92ZUNsYXNzIGFwcGVuZCBwcmVwZW5kJy5zcGxpdCgnICcpO1xyXG5cclxuZm9yKHZhciBrZXkgaW4gZG9jKXtcclxuICAgIGlmKHR5cGVvZiBkb2Nba2V5XSA9PT0gJ2Z1bmN0aW9uJyl7XHJcbiAgICAgICAgZmxvY1trZXldID0gZG9jW2tleV07XHJcbiAgICAgICAgZmxvY1Byb3RvW2tleV0gPSAoZnVuY3Rpb24oa2V5KXtcclxuICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcclxuICAgICAgICAgICAgLy8gVGhpcyBpcyBhbHNvIGV4dHJlbWVseSBkb2RneSBhbmQgZmFzdFxyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oYSxiLGMsZCxlLGYpe1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGRvY1trZXldKHRoaXMsIGEsYixjLGQsZSxmKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihyZXN1bHQgIT09IGRvYyAmJiBpc0xpc3QocmVzdWx0KSl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZsb2MocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHJldHVybnNTZWxmLmluZGV4T2Yoa2V5KSA+PTApe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfShrZXkpKTtcclxuICAgIH1cclxufVxyXG5mbG9jUHJvdG8ub24gPSBmdW5jdGlvbihldmVudHMsIHRhcmdldCwgY2FsbGJhY2spe1xyXG4gICAgdmFyIHByb3h5ID0gdGhpcztcclxuICAgIGlmKHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbicpe1xyXG4gICAgICAgIGNhbGxiYWNrID0gdGFyZ2V0O1xyXG4gICAgICAgIHRhcmdldCA9IHRoaXM7XHJcbiAgICAgICAgcHJveHkgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgZG9jLm9uKGV2ZW50cywgdGFyZ2V0LCBjYWxsYmFjaywgcHJveHkpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5mbG9jUHJvdG8ub2ZmID0gZnVuY3Rpb24oZXZlbnRzLCB0YXJnZXQsIGNhbGxiYWNrKXtcclxuICAgIHZhciByZWZlcmVuY2UgPSB0aGlzO1xyXG4gICAgaWYodHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJyl7XHJcbiAgICAgICAgY2FsbGJhY2sgPSB0YXJnZXQ7XHJcbiAgICAgICAgdGFyZ2V0ID0gdGhpcztcclxuICAgICAgICByZWZlcmVuY2UgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgZG9jLm9mZihldmVudHMsIHRhcmdldCwgY2FsbGJhY2ssIHJlZmVyZW5jZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZsb2NQcm90by5yZWFkeSA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuICAgIGRvYy5yZWFkeShjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZsb2NQcm90by5hZGRDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTmFtZSl7XHJcbiAgICBkb2MuYWRkQ2xhc3ModGhpcywgY2xhc3NOYW1lKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZmxvY1Byb3RvLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oY2xhc3NOYW1lKXtcclxuICAgIGRvYy5yZW1vdmVDbGFzcyh0aGlzLCBjbGFzc05hbWUpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZsb2M7IiwidmFyIHNpbmdsZUlkID0gL14jXFx3KyQvO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRvY3VtZW50KXtcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0VGFyZ2V0KHRhcmdldCl7XG4gICAgICAgIGlmKHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnKXtcbiAgICAgICAgICAgIGlmKHNpbmdsZUlkLmV4ZWModGFyZ2V0KSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhcmdldC5zbGljZSgxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9O1xufTsiLCJcbnZhciBzaW5nbGVDbGFzcyA9IC9eXFwuXFx3KyQvLFxuICAgIHNpbmdsZUlkID0gL14jXFx3KyQvLFxuICAgIHNpbmdsZVRhZyA9IC9eXFx3KyQvO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRvY3VtZW50KXtcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0VGFyZ2V0cyh0YXJnZXQpe1xuICAgICAgICBpZih0eXBlb2YgdGFyZ2V0ID09PSAnc3RyaW5nJyl7XG4gICAgICAgICAgICBpZihzaW5nbGVJZC5leGVjKHRhcmdldCkpe1xuICAgICAgICAgICAgICAgIC8vIElmIHlvdSBoYXZlIG1vcmUgdGhhbiAxIG9mIHRoZSBzYW1lIGlkIGluIHlvdXIgcGFnZSxcbiAgICAgICAgICAgICAgICAvLyB0aGF0cyB5b3VyIG93biBzdHVwaWQgZmF1bHQuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YXJnZXQuc2xpY2UoMSkpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHNpbmdsZVRhZy5leGVjKHRhcmdldCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoc2luZ2xlQ2xhc3MuZXhlYyh0YXJnZXQpKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSh0YXJnZXQuc2xpY2UoMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGFyZ2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0xpc3Qob2JqZWN0KXtcclxuICAgIHJldHVybiBvYmplY3QgIT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiAnbGVuZ3RoJyBpbiBvYmplY3QgJiYgISgnbm9kZVR5cGUnIGluIG9iamVjdCkgJiYgb2JqZWN0LnNlbGYgIT0gb2JqZWN0OyAvLyBpbiBJRTgsIHdpbmRvdy5zZWxmIGlzIHdpbmRvdywgYnV0IGl0IGlzIG5vdCA9PT0gd2luZG93LCBidXQgaXQgaXMgPT0gd2luZG93Li4uLi4uLi4uIFdURiE/XHJcbn0iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxuICAgIGNyZWwgPSByZXF1aXJlKCdjcmVsJyksXG4gICAgRGVmYXVsdFN0eWxlID0gcmVxdWlyZSgnZGVmYXVsdC1zdHlsZScpO1xuXG5uZXcgRGVmYXVsdFN0eWxlKCcucHJlZGljdHl7ZGlzcGxheTppbmxpbmUtYmxvY2s7cG9zaXRpb246cmVsYXRpdmU7aGVpZ2h0OiAyNXB4O3dpZHRoOjIwMHB4O30ucHJlZGljdHlQcmVkaWN0aW9ue29wYWNpdHk6MC4yO3BvaW50ZXItZXZlbnRzOm5vbmU7cG9zaXRpb246YWJzb2x1dGU7IHRvcDowO2xlZnQ6MDtyaWdodDowO2JvdHRvbTowO2hlaWdodDowO21hcmdpbjphdXRvIDA7fS5wcmVkaWN0eSAqe2ZvbnQ6IGluaGVyaXQ7fS5wcmVkaWN0eUlucHV0e3Bvc2l0aW9uOmFic29sdXRlO3RvcDowO2xlZnQ6MDtib3R0b206MDtyaWdodDowO3dpZHRoOjEwMCU7fS5wcmVkaWN0eVN1Z2dlc3Rpb24sIC5wcmVkaWN0eU1hc2t7cG9zaXRpb246cmVsYXRpdmU7IHotaW5kZXg6MTt2ZXJ0aWNhbC1hbGlnbjptaWRkbGU7IGxpbmUtaGVpZ2h0OjA7fS5wcmVkaWN0eU1hc2t7b3BhY2l0eTowO3BhZGRpbmctcmlnaHQ6MnB4O30nKTtcblxuZnVuY3Rpb24gUHJlZGljdHkoKXtcbiAgICB0aGlzLl9yZW5kZXIoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG4gICAgdGhpcy5fdXBkYXRlKCk7XG59XG5QcmVkaWN0eS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50RW1pdHRlci5wcm90b3R5cGUpO1xuUHJlZGljdHkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJlZGljdHk7XG5QcmVkaWN0eS5wcm90b3R5cGUuX3ZhbHVlID0gJyc7XG5QcmVkaWN0eS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbih2YWx1ZSl7XG4gICAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpe1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuXG4gICAgaWYodmFsdWUgPT0gdGhpcy5fdmFsdWUpe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fdmFsdWUgPSAnJyt2YWx1ZTtcbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgICB0aGlzLmVtaXQoJ3ZhbHVlJywgdGhpcy5fdmFsdWUpO1xufTtcblByZWRpY3R5LnByb3RvdHlwZS5faXRlbXMgPSBbXTtcblByZWRpY3R5LnByb3RvdHlwZS5pdGVtcyA9IGZ1bmN0aW9uKGl0ZW1zKXtcbiAgICBpZighYXJndW1lbnRzLmxlbmd0aCl7XG4gICAgICAgIHJldHVybiB0aGlzLl9pdGVtcztcbiAgICB9XG5cbiAgICBpZighQXJyYXkuaXNBcnJheShpdGVtcykpe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5faXRlbXMgPSBpdGVtcy5zbGljZSgpO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICAgIHRoaXMuZW1pdCgnaXRlbXMnLCBpdGVtcyk7XG59O1xuUHJlZGljdHkucHJvdG90eXBlLl9hY2NlcHRQcmVkaWN0aW9uID0gZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLl9zdWdnZXN0aW9uICE9IG51bGwpe1xuICAgICAgICB0aGlzLnZhbHVlKHRoaXMuX3N1Z2dlc3Rpb24pO1xuICAgICAgICB0aGlzLmVtaXQoJ2FjY2VwdCcsIHRoaXMuX3N1Z2dlc3Rpb24pO1xuICAgIH1cbn07XG5QcmVkaWN0eS5wcm90b3R5cGUuX21hdGNoSXRlbSA9IGZ1bmN0aW9uKHZhbHVlLCBpdGVtKXtcbiAgICByZXR1cm4gdmFsdWUgJiYgaXRlbS50b0xvd2VyQ2FzZSgpLmluZGV4T2YodmFsdWUudG9Mb3dlckNhc2UoKSkgPT09IDA7XG59O1xuUHJlZGljdHkucHJvdG90eXBlLl9tYXRjaCA9IGZ1bmN0aW9uKHZhbHVlKXtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLml0ZW1zKCk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgaWYodGhpcy5fbWF0Y2hJdGVtKHZhbHVlLCBpdGVtc1tpXSkpe1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW1zW2ldO1xuICAgICAgICB9XG4gICAgfVxufTtcblByZWRpY3R5LnByb3RvdHlwZS5fdXBkYXRlVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSl7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcbn07XG5QcmVkaWN0eS5wcm90b3R5cGUuX3VwZGF0ZVN1Z2dlc3Rpb24gPSBmdW5jdGlvbih2YWx1ZSwgc3VnZ2VzdGlvbil7XG4gICAgdGhpcy5tYXNrRWxlbWVudC50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgIHRoaXMuc3VnZ2VzdGlvbkVsZW1lbnQudGV4dENvbnRlbnQgPSBzdWdnZXN0aW9uO1xufTtcblByZWRpY3R5LnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlKCk7XG5cbiAgICB0aGlzLl9zdWdnZXN0aW9uID0gdGhpcy5fbWF0Y2godmFsdWUpO1xuXG4gICAgdGhpcy5fdXBkYXRlVmFsdWUodmFsdWUpO1xuXG4gICAgaWYoIXRoaXMuX3N1Z2dlc3Rpb24pe1xuICAgICAgICB0aGlzLl91cGRhdGVTdWdnZXN0aW9uKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl91cGRhdGVTdWdnZXN0aW9uKHZhbHVlLCB0aGlzLl9zdWdnZXN0aW9uLnNsaWNlKHZhbHVlLmxlbmd0aCkpO1xufTtcblByZWRpY3R5LnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHByZWRpY3R5ID0gdGhpcztcblxuICAgIHRoaXMuX2lucHV0TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICAgIHByZWRpY3R5LnZhbHVlKHRoaXMudmFsdWUpO1xuICAgIH07XG5cbiAgICB0aGlzLl90YWJMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgaWYoZXZlbnQud2hpY2ggPT09IDkpe1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHByZWRpY3R5Ll9hY2NlcHRQcmVkaWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5pbnB1dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9pbnB1dExpc3RlbmVyKTtcbiAgICB0aGlzLmlucHV0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fdGFiTGlzdGVuZXIpO1xufTtcblByZWRpY3R5LnByb3RvdHlwZS5fcmVuZGVyID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVsZW1lbnQgPSBjcmVsKCdzcGFuJywgeydjbGFzcyc6J3ByZWRpY3R5J30sXG4gICAgICAgIHRoaXMuaW5wdXRFbGVtZW50ID0gY3JlbCgnaW5wdXQnLCB7J2NsYXNzJzoncHJlZGljdHlJbnB1dCd9KSxcbiAgICAgICAgdGhpcy5wcmVkaWN0aW9uRWxlbWVudCA9IGNyZWwoJ2RpdicsIHsnY2xhc3MnOidwcmVkaWN0eVByZWRpY3Rpb24nfSxcbiAgICAgICAgICAgIHRoaXMubWFza0VsZW1lbnQgPSBjcmVsKCdzcGFuJywgeydjbGFzcyc6J3ByZWRpY3R5TWFzayd9KSxcbiAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbkVsZW1lbnQgPSBjcmVsKCdzcGFuJywgeydjbGFzcyc6J3ByZWRpY3R5U3VnZ2VzdGlvbid9KVxuICAgICAgICApXG4gICAgKTtcbn07XG5QcmVkaWN0eS5fZGViaW5kID0gZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLl9pbnB1dExpc3RlbmVyKXtcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9pbnB1dExpc3RlbmVyKTtcbiAgICAgICAgdGhpcy5faW5wdXRMaXN0ZW5lciA9IG51bGw7XG4gICAgfVxuICAgIGlmKHRoaXMuX3RhYkxpc3RlbmVyKXtcbiAgICAgICAgdGhpcy5pbnB1dEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX3RhYkxpc3RlbmVyKTtcbiAgICAgICAgdGhpcy5fdGFiTGlzdGVuZXIgPSBudWxsO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJlZGljdHk7IiwidmFyIGRlZmF1bHRTdHlsZXMsXG4gICAgdmFsaWRFbnZpcm9ubWVudDtcblxuZnVuY3Rpb24gaW5zZXJ0VGFnKCl7XG4gICAgZG9jdW1lbnQuaGVhZC5pbnNlcnRCZWZvcmUoZGVmYXVsdFN0eWxlcywgZG9jdW1lbnQuaGVhZC5jaGlsZE5vZGVzWzBdKTtcbn1cblxuaWYoXG4gICAgdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICB0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgdHlwZW9mIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlID09PSAndW5kZWZpbmVkJ1xuKXtcbiAgICBjb25zb2xlLndhcm4oJ05vIGFwcHJvcHJhdGUgZW52aXJvbm1lbnQsIG5vIHN0eWxlcyB3aWxsIGJlIGFkZGVkLicpO1xufWVsc2V7XG4gICAgdmFsaWRFbnZpcm9ubWVudCA9IHRydWU7XG5cbiAgICBkZWZhdWx0U3R5bGVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblxuICAgIGlmKGRvY3VtZW50LmhlYWQpe1xuICAgICAgICBpbnNlcnRUYWcoKTtcbiAgICB9ZWxzZXtcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGluc2VydFRhZyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBEZWZhdWx0U3R5bGUoY3NzVGV4dCwgZG9udEluc2VydCl7XG4gICAgaWYoIXZhbGlkRW52aXJvbm1lbnQpe1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB0aGlzLl9ub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzVGV4dCB8fCAnJyk7XG5cbiAgICBpZighZG9udEluc2VydCl7XG4gICAgICAgIHRoaXMuaW5zZXJ0KCk7XG4gICAgfVxufVxuRGVmYXVsdFN0eWxlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbih0YXJnZXQpe1xuICAgIGlmKCF2YWxpZEVudmlyb25tZW50KXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRhcmdldCB8fCAodGFyZ2V0ID0gZGVmYXVsdFN0eWxlcyk7XG5cbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQodGhpcy5fbm9kZSk7XG59O1xuRGVmYXVsdFN0eWxlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCF2YWxpZEVudmlyb25tZW50KXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl9ub2RlLnBhcmVudEVsZW1lbnQ7XG4gICAgaWYocGFyZW50KXtcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMuX25vZGUpO1xuICAgIH1cbn07XG5EZWZhdWx0U3R5bGUucHJvdG90eXBlLmNzcyA9IGZ1bmN0aW9uKGNzc1RleHQpe1xuICAgIGlmKCF2YWxpZEVudmlyb25tZW50KXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmKCFhcmd1bWVudHMubGVuZ3RoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vZGUudGV4dENvbnRlbnQ7XG4gICAgfVxuXG4gICAgdGhpcy5fbm9kZS50ZXh0Q29udGVudCA9IGNzc1RleHQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHRTdHlsZTsiLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICAnVGFtbXkgRHVubicsXG4gICAgJ0FydGh1ciBNb3JyaXNvbicsXG4gICAgJ1JhbHBoIEZvd2xlcicsXG4gICAgJ1N1c2FuIEdyYXknLFxuICAgICdKb3NlIEdyYWhhbScsXG4gICAgJ0NocmlzdGluZSBSZXllcycsXG4gICAgJ0Rvcm90aHkgVG9ycmVzJyxcbiAgICAnQ2hyaXN0aW5lIFNtaXRoJyxcbiAgICAnTWFyaWEgQmlzaG9wJyxcbiAgICAnU3VzYW4gUGFya2VyJyxcbiAgICAnUmFscGggQ3VubmluZ2hhbScsXG4gICAgJ05pY2hvbGFzIEFybm9sZCcsXG4gICAgJ1JlYmVjY2EgR3JheScsXG4gICAgJ0NhcmxvcyBNYXR0aGV3cycsXG4gICAgJ0FudGhvbnkgTWlsbGVyJyxcbiAgICAnTGF1cmEgV2Fsa2VyJyxcbiAgICAnQW5uIEhpY2tzJyxcbiAgICAnUGhpbGlwIEFuZHJld3MnLFxuICAgICdBbGFuIFJpY2UnLFxuICAgICdQYXRyaWNrIFdlYmInLFxuICAgICdBbm4gSGF5ZXMnLFxuICAgICdMaW5kYSBIYXllcycsXG4gICAgJ1Njb3R0IEJhcm5lcycsXG4gICAgJ0xhd3JlbmNlIE1hcnNoYWxsJyxcbiAgICAnU2NvdHQgQnV0bGVyJyxcbiAgICAnQW5uYSBSb2dlcnMnLFxuICAgICdEaWFuYSBGbG9yZXMnLFxuICAgICdHZXJhbGQgSGFsbCcsXG4gICAgJ0p1bGllIExhd3NvbicsXG4gICAgJ0thdGhyeW4gU2ltbW9ucycsXG4gICAgJ0JhcmJhcmEgUm9zZScsXG4gICAgJ0JvYmJ5IEdhcmRuZXInLFxuICAgICdFbWlseSBTY290dCcsXG4gICAgJ0thcmVuIEphY29icycsXG4gICAgJ0hhcnJ5IExhbmUnLFxuICAgICdSdXNzZWxsIER1bm4nLFxuICAgICdKb2FuIEFybXN0cm9uZycsXG4gICAgJ0tldmluIFdpbGxpcycsXG4gICAgJ1JhbmR5IFJhbW9zJyxcbiAgICAnQmV2ZXJseSBPbHNvbicsXG4gICAgJ01hcnkgU2FuY2hleicsXG4gICAgJ0JhcmJhcmEgQXJub2xkJyxcbiAgICAnTWlsZHJlZCBUaG9tYXMnLFxuICAgICdLYXRocnluIFBlcnJ5JyxcbiAgICAnSmVhbiBXYXNoaW5ndG9uJyxcbiAgICAnUGF1bCBDb2xlbWFuJyxcbiAgICAnSmFtZXMgS2VubmVkeScsXG4gICAgJ1BhdHJpY2sgQ2hhcG1hbicsXG4gICAgJ1BoaWxpcCBEZWFuJyxcbiAgICAnTm9ybWEgUmljaGFyZHMnLFxuICAgICdOaWNvbGUgU2ltcycsXG4gICAgJ0FuZHJldyBNYXJzaGFsbCcsXG4gICAgJ0tldmluIFBheW5lJyxcbiAgICAnSm9uYXRoYW4gUGF5bmUnLFxuICAgICdMb2lzIEZvcmQnLFxuICAgICdJcmVuZSBPcnRpeicsXG4gICAgJ0hlbnJ5IE93ZW5zJyxcbiAgICAnSm9obm55IEdvcmRvbicsXG4gICAgJ0thdGhsZWVuIEhhcnJpcycsXG4gICAgJ0pvYW4gRWxsaW90dCcsXG4gICAgJ1BhdHJpY2sgUG9ydGVyJyxcbiAgICAnSXJlbmUgR2lic29uJyxcbiAgICAnTWFyayBMZXdpcycsXG4gICAgJ1N1c2FuIEh1ZHNvbicsXG4gICAgJ1NoaXJsZXkgSGFuc2VuJyxcbiAgICAnQXNobGV5IEFuZGVyc29uJyxcbiAgICAnSnVzdGluIEhlbnJ5JyxcbiAgICAnU3RldmVuIFBhcmtlcicsXG4gICAgJ1Jvc2UgUmljaGFyZHNvbicsXG4gICAgJ1J1c3NlbGwgWW91bmcnLFxuICAgICdNZWxpc3NhIEpvcmRhbicsXG4gICAgJ0V2ZWx5biBCYXJuZXMnLFxuICAgICdNaWNoZWxsZSBNZW5kb3phJyxcbiAgICAnRGFuaWVsIEh1Z2hlcycsXG4gICAgJ0Rvcm90aHkgRGF5JyxcbiAgICAnS2VsbHkgQW5kZXJzb24nLFxuICAgICdSdWJ5IFN0ZXZlbnMnLFxuICAgICdFbGl6YWJldGggT3J0aXonLFxuICAgICdFcm5lc3QgR2FyZG5lcicsXG4gICAgJ0thdGhsZWVuIFJ1c3NlbGwnLFxuICAgICdBbm5lIFdpbGxpYW1zJyxcbiAgICAnRGVicmEgSGFycmlzb24nLFxuICAgICdKYXNvbiBDcnV6JyxcbiAgICAnUGF0cmljaWEgQ3VubmluZ2hhbScsXG4gICAgJ0RhbmllbCBCcmFkbGV5JyxcbiAgICAnUnlhbiBCdXRsZXInLFxuICAgICdDaHJpc3RvcGhlciBDYW1wYmVsbCcsXG4gICAgJ0JhcmJhcmEgUGVycnknLFxuICAgICdEaWFuZSBTaW1zJyxcbiAgICAnQ2xhcmVuY2UgSGFydmV5JyxcbiAgICAnQW50b25pbyBDYXJwZW50ZXInLFxuICAgICdKZW5uaWZlciBSeWFuJyxcbiAgICAnUGh5bGxpcyBKb3JkYW4nLFxuICAgICdCZXZlcmx5IFJpY2UnLFxuICAgICdTYW11ZWwgSm9yZGFuJyxcbiAgICAnQWxpY2UgSGVucnknLFxuICAgICdQYW1lbGEgU2ltbW9ucycsXG4gICAgJ0FteSBCdXJrZScsXG4gICAgJ0thdGhsZWVuIFJlaWQnLFxuICAgICdMaW5kYSBKYWNrc29uJyxcbiAgICAnQnJlbmRhIEFsdmFyZXonLFxuICAgICdCcnVjZSBIdWRzb24nLFxuICAgICdTaGF3biBIYXJ2ZXknLFxuICAgICdFbGl6YWJldGggQ2hhcG1hbicsXG4gICAgJ0FsYmVydCBHb256YWxleicsXG4gICAgJ0dlb3JnZSBNaWxsZXInLFxuICAgICdTY290dCBGcmVlbWFuJyxcbiAgICAnQnJhbmRvbiBTdGV3YXJ0JyxcbiAgICAnVGVycnkgQ2hhdmV6JyxcbiAgICAnVGhvbWFzIEhlcm5hbmRleicsXG4gICAgJ0hlbGVuIENhcnBlbnRlcicsXG4gICAgJ0plZmZyZXkgSm9obnNvbicsXG4gICAgJ0Rvbm5hIE1leWVyJyxcbiAgICAnUmFscGggS2VsbGV5JyxcbiAgICAnSGVsZW4gQmFybmVzJyxcbiAgICAnR2xvcmlhIE15ZXJzJyxcbiAgICAnQW1hbmRhIER1bmNhbicsXG4gICAgJ0hhcm9sZCBGZXJndXNvbicsXG4gICAgJ01pY2hlbGxlIENhbXBiZWxsJyxcbiAgICAnTm9ybWEgTW9ycmlzb24nLFxuICAgICdUaW1vdGh5IFR1cm5lcicsXG4gICAgJ0plcmVteSBMYW5lJyxcbiAgICAnTWFyaWEgV2F0a2lucycsXG4gICAgJ1BhbWVsYSBPbHNvbicsXG4gICAgJ0VyaWMgRHVubicsXG4gICAgJ1Njb3R0IEdlb3JnZScsXG4gICAgJ0lyZW5lIFRvcnJlcycsXG4gICAgJ1dhbmRhIEZvcmQnLFxuICAgICdSb2JpbiBIb3dlbGwnLFxuICAgICdLYXRoZXJpbmUgUGhpbGxpcHMnLFxuICAgICdFYXJsIFBldGVyc29uJyxcbiAgICAnQWxpY2UgUmljZScsXG4gICAgJ0lyZW5lIEdpYnNvbicsXG4gICAgJ0RlbmlzZSBNYXJ0aW5leicsXG4gICAgJ01hcmdhcmV0IEFsdmFyZXonLFxuICAgICdBcnRodXIgUGVya2lucycsXG4gICAgJ0pvaG5ueSBHb256YWxleicsXG4gICAgJ1dheW5lIEx5bmNoJyxcbiAgICAnV2FsdGVyIFJvYmVydHNvbicsXG4gICAgJ0NocmlzIExhbmUnLFxuICAgICdKb25hdGhhbiBDb29wZXInLFxuICAgICdTZWFuIFJhbW9zJyxcbiAgICAnSm9hbiBZb3VuZycsXG4gICAgJ1NhbmRyYSBIYXJwZXInLFxuICAgICdBbmdlbGEgQ29sZW1hbicsXG4gICAgJ0FuZHJlYSBEdW5jYW4nLFxuICAgICdMb2lzIFdoaXRlJyxcbiAgICAnQ2hyaXMgU3RvbmUnLFxuICAgICdCaWxseSBXaWxzb24nLFxuICAgICdCb2JieSBXaWxsaWFtcycsXG4gICAgJ1Rob21hcyBQZXRlcnNvbicsXG4gICAgJ0NocmlzdG9waGVyIFdpbGxpcycsXG4gICAgJ1JhY2hlbCBXZWxjaCcsXG4gICAgJ1JhY2hlbCBIZW5kZXJzb24nLFxuICAgICdBbmRyZWEgSm9obnNvbicsXG4gICAgJ0RvcmlzIFJlaWQnLFxuICAgICdEb3JvdGh5IEJveWQnLFxuICAgICdBbnRvbmlvIENhbXBiZWxsJyxcbiAgICAnQW5nZWxhIEhhcnZleScsXG4gICAgJ0phbWVzIFNpbXBzb24nLFxuICAgICdKZXJlbXkgU2NobWlkdCcsXG4gICAgJ1JhbHBoIFBlcmtpbnMnLFxuICAgICdXaWxsaWUgSGFydCcsXG4gICAgJ0dsb3JpYSBSaWNlJyxcbiAgICAnQ2hyaXMgSG9sbWVzJyxcbiAgICAnUmFuZHkgV29vZHMnLFxuICAgICdNaWxkcmVkIEdyYWhhbScsXG4gICAgJ0pveWNlIFJpdmVyYScsXG4gICAgJ0p1YW4gV2VzdCcsXG4gICAgJ0Rvcm90aHkgR29yZG9uJyxcbiAgICAnVGVycnkgTWlsbHMnLFxuICAgICdMb2lzIFNpbW1vbnMnLFxuICAgICdIYXJvbGQgR29yZG9uJyxcbiAgICAnRnJlZCBGbG9yZXMnLFxuICAgICdTdGV2ZW4gTW9udGdvbWVyeScsXG4gICAgJ0NoZXJ5bCBNb3JyaXNvbicsXG4gICAgJ0FydGh1ciBKYWNrc29uJyxcbiAgICAnU2FuZHJhIFNjb3R0JyxcbiAgICAnQ2hyaXN0aW5lIFBldGVycycsXG4gICAgJ0xvdWlzIEd1dGllcnJleicsXG4gICAgJ0FteSBNb250Z29tZXJ5JyxcbiAgICAnVGFtbXkgUGV0ZXJzJyxcbiAgICAnUGh5bGxpcyBDaGFwbWFuJyxcbiAgICAnQXNobGV5IENvb2snLFxuICAgICdLZWxseSBMYXdzb24nLFxuICAgICdBbGljZSBSZXlub2xkcycsXG4gICAgJ0tlbm5ldGggTGV3aXMnLFxuICAgICdTZWFuIERheScsXG4gICAgJ0thdGhlcmluZSBQaGlsbGlwcycsXG4gICAgJ0Rlbm5pcyBLZWxseScsXG4gICAgJ01lbGlzc2EgRGF5JyxcbiAgICAnQnJhbmRvbiBPbGl2ZXInLFxuICAgICdQYXVsIE11cnBoeScsXG4gICAgJ0phbmV0IFdhdGtpbnMnLFxuICAgICdNYXJ5IFBoaWxsaXBzJyxcbiAgICAnUnlhbiBCb3dtYW4nLFxuICAgICdIZWxlbiBSaWxleScsXG4gICAgJ0Fhcm9uIFBoaWxsaXBzJyxcbiAgICAnQmV0dHkgUGVyZXonLFxuICAgICdLYXRocnluIENvbGxpbnMnLFxuICAgICdXYWx0ZXIgQ2xhcmsnLFxuICAgICdBbmRyZXcgQnV0bGVyJyxcbiAgICAnRXVnZW5lIFNoYXcnLFxuICAgICdMb3JpIEhvbG1lcycsXG4gICAgJ0RpYW5hIEFkYW1zJyxcbiAgICAnSmVyZW15IE1hcnRpbmV6JyxcbiAgICAnU3RldmUgQmFua3MnLFxuICAgICdCZW5qYW1pbiBIZW5yeScsXG4gICAgJ0JyaWFuIE5pY2hvbHMnLFxuICAgICdKb3ljZSBXcmlnaHQnLFxuICAgICdKb2hubnkgQ294JyxcbiAgICAnTGluZGEgTWFydGluZXonLFxuICAgICdCb2JieSBTdGV3YXJ0JyxcbiAgICAnU3VzYW4gRGVhbicsXG4gICAgJ0VhcmwgQ2xhcmsnLFxuICAgICdKb2hubnkgQ294JyxcbiAgICAnQnJlbmRhIExvbmcnLFxuICAgICdDbGFyZW5jZSBCcmFkbGV5JyxcbiAgICAnRXJpYyBNb3JnYW4nLFxuICAgICdTdGV2ZW4gTXllcnMnLFxuICAgICdHcmVnb3J5IE5pY2hvbHMnLFxuICAgICdJcmVuZSBFZHdhcmRzJyxcbiAgICAnV2lsbGllIE1hcnRpbicsXG4gICAgJ05hbmN5IFJpbGV5JyxcbiAgICAnTWFyeSBIZXJuYW5kZXonLFxuICAgICdKdWR5IE5ndXllbicsXG4gICAgJ01pY2hlbGxlIEd1dGllcnJleicsXG4gICAgJ0JvYmJ5IE5ndXllbicsXG4gICAgJ0pvc2h1YSBNYXNvbicsXG4gICAgJ01hcmlhIEhhbnNvbicsXG4gICAgJ1ZpY3RvciBEdW5jYW4nLFxuICAgICdIZWxlbiBCcnlhbnQnLFxuICAgICdTdGVwaGVuIFBhcmtlcicsXG4gICAgJ1RlcnJ5IE1lZGluYScsXG4gICAgJ01hcnkgSm9obnN0b24nLFxuICAgICdUaGVyZXNhIEJ1cmtlJyxcbiAgICAnV2FuZGEgU2FuY2hleicsXG4gICAgJ0FuZ2VsYSBSaWNoYXJkcycsXG4gICAgJ0FtYW5kYSBIb2xtZXMnLFxuICAgICdHZXJhbGQgR3JpZmZpbicsXG4gICAgJ0dyZWdvcnkgQ294JyxcbiAgICAnQW5kcmVhIEdhcmNpYScsXG4gICAgJ0Vkd2FyZCBMYXdzb24nLFxuICAgICdCZXR0eSBTcGVuY2VyJyxcbiAgICAnSmltbXkgWW91bmcnLFxuICAgICdFcmljIEhhbnNlbicsXG4gICAgJ0FuZHJlYSBNYXJzaGFsbCcsXG4gICAgJ01hdHRoZXcgTW9yZ2FuJyxcbiAgICAnUmF5bW9uZCBSaXZlcmEnLFxuICAgICdBbm5lIFBvcnRlcicsXG4gICAgJ0NhcmwgSG93ZWxsJyxcbiAgICAnSm9zZXBoIE9ydGl6JyxcbiAgICAnSm9obm55IFNhbmRlcnMnLFxuICAgICdCcmVuZGEgRm94JyxcbiAgICAnTWFyZ2FyZXQgTWVuZG96YScsXG4gICAgJ1BhbWVsYSBKYW1lcycsXG4gICAgJ1BoaWxpcCBNdXJyYXknLFxuICAgICdBbWFuZGEgSm9obnN0b24nLFxuICAgICdQYXRyaWNrIEJyeWFudCcsXG4gICAgJ0pvaG5ueSBTdGVwaGVucycsXG4gICAgJ0FubmllIEtuaWdodCcsXG4gICAgJ0Rvcm90aHkgUm9nZXJzJyxcbiAgICAnUGhpbGlwIFdoZWVsZXInLFxuICAgICdNaWNoYWVsIFBoaWxsaXBzJyxcbiAgICAnSm9zaHVhIEh1bnRlcicsXG4gICAgJ1NhcmEgUml2ZXJhJyxcbiAgICAnVGhvbWFzIEpvbmVzJyxcbiAgICAnTmFuY3kgV2VhdmVyJyxcbiAgICAnSm9zaHVhIE1vcmdhbicsXG4gICAgJ0xhd3JlbmNlIFJpdmVyYScsXG4gICAgJ1Njb3R0IFdvb2QnLFxuICAgICdCcmlhbiBDaGF2ZXonLFxuICAgICdNYXJ0aW4gR29uemFsZXMnLFxuICAgICdTdGV2ZW4gTW9ycmlzb24nLFxuICAgICdCcmVuZGEgSGVuZGVyc29uJyxcbiAgICAnRGlhbmUgR3JheScsXG4gICAgJ1JpY2hhcmQgQWxleGFuZGVyJyxcbiAgICAnQW50aG9ueSBTY2htaWR0JyxcbiAgICAnVGFtbXkgRmllbGRzJyxcbiAgICAnUmF5bW9uZCBHcmFudCcsXG4gICAgJ0xvcmkgV2VhdmVyJyxcbiAgICAnSGFyb2xkIE1hc29uJyxcbiAgICAnS2FyZW4gU3RvbmUnLFxuICAgICdOaWNvbGUgTGF3cmVuY2UnLFxuICAgICdEZWJyYSBIaWNrcycsXG4gICAgJ0Nhcm9seW4gSGFuc2VuJyxcbiAgICAnQ2xhcmVuY2UgR29uemFsZXonLFxuICAgICdQYW1lbGEgVG9ycmVzJyxcbiAgICAnUm9uYWxkIExld2lzJyxcbiAgICAnSmVzc2UgR29tZXonLFxuICAgICdEb25uYSBHb256YWxleicsXG4gICAgJ1RlcmVzYSBNeWVycycsXG4gICAgJ0RvbmFsZCBTcGVuY2VyJyxcbiAgICAnR2VvcmdlIE11cnBoeScsXG4gICAgJ01hcmdhcmV0IENhcnInLFxuICAgICdMb3Vpc2UgTWVkaW5hJyxcbiAgICAnTWF0dGhldyBSYW1pcmV6JyxcbiAgICAnUm9uYWxkIENhc3RpbGxvJyxcbiAgICAnQnJlbmRhIFJ1c3NlbGwnLFxuICAgICdBbmdlbGEgV2F0a2lucycsXG4gICAgJ0JpbGx5IFNhbmRlcnMnLFxuICAgICdDaHJpcyBNYXJ0aW5leicsXG4gICAgJ0plcnJ5IEJhcm5lcycsXG4gICAgJ0FuZHJlYSBIYWxsJyxcbiAgICAnTWFydGhhIE1vcmdhbicsXG4gICAgJ0phbmUgRGlheicsXG4gICAgJ1RlcmVzYSBTY290dCcsXG4gICAgJ1JvbmFsZCBSaWNoYXJkcycsXG4gICAgJ1JvYmluIEJlbGwnLFxuICAgICdUYW1teSBWYXNxdWV6JyxcbiAgICAnQmV0dHkgVGhvbXBzb24nLFxuICAgICdMaXNhIE1pbGxlcicsXG4gICAgJ1ZpY3RvciBGb3gnLFxuICAgICdLZWl0aCBHYXJkbmVyJyxcbiAgICAnQ2Fyb2wgTWFydGluZXonLFxuICAgICdIZWxlbiBDYXN0aWxsbycsXG4gICAgJ1dpbGxpYW0gV2Fsa2VyJyxcbiAgICAnRW1pbHkgRXZhbnMnLFxuICAgICdIZWF0aGVyIFBoaWxsaXBzJyxcbiAgICAnSmVzc2ljYSBXYXRzb24nLFxuICAgICdBbGljZSBGb3JkJyxcbiAgICAnQ2hyaXMgSHVnaGVzJyxcbiAgICAnRG9uYWxkIEJyeWFudCcsXG4gICAgJ1NoYXJvbiBIdW50ZXInLFxuICAgICdOYW5jeSBEaXhvbicsXG4gICAgJ1NhcmEgQmlzaG9wJyxcbiAgICAnTWFyaWUgSm9yZGFuJyxcbiAgICAnQm9ubmllIFN0b25lJyxcbiAgICAnUGF0cmljayBIYWxsJyxcbiAgICAnU3VzYW4gU3RlcGhlbnMnLFxuICAgICdKYW5pY2UgS2VsbHknLFxuICAgICdKYW1lcyBHYXJjaWEnLFxuICAgICdKYW5pY2UgUm9zcycsXG4gICAgJ01hcnkgSG93YXJkJyxcbiAgICAnU3RlcGhhbmllIE1vcmFsZXMnLFxuICAgICdUYW1teSBMb25nJyxcbiAgICAnSnVkaXRoIFdoZWVsZXInLFxuICAgICdSdWJ5IFRob21wc29uJyxcbiAgICAnQW50aG9ueSBCb3lkJyxcbiAgICAnU2hhd24gTGV3aXMnLFxuICAgICdSZWJlY2NhIFdlYmInLFxuICAgICdMYXdyZW5jZSBSaWNoYXJkcycsXG4gICAgJ1NhcmEgUm9tZXJvJyxcbiAgICAnU2FyYSBGdWxsZXInLFxuICAgICdDbGFyZW5jZSBTaW1tb25zJyxcbiAgICAnTWFyaWx5biBNYXJ0aW4nLFxuICAgICdMaWxsaWFuIEZlcmd1c29uJyxcbiAgICAnUGF1bCBQb3J0ZXInLFxuICAgICdCYXJiYXJhIExvcGV6JyxcbiAgICAnRGVuaXNlIEdpbGJlcnQnLFxuICAgICdOb3JtYSBXZWxscycsXG4gICAgJ0tlbGx5IEhhbGwnLFxuICAgICdLaW1iZXJseSBTYW5kZXJzJyxcbiAgICAnQWFyb24gV2ViYicsXG4gICAgJ0FydGh1ciBEaXhvbicsXG4gICAgJ0hhcm9sZCBQaGlsbGlwcycsXG4gICAgJ0thdGh5IExlZScsXG4gICAgJ0tldmluIFdhZ25lcicsXG4gICAgJ0phbmUgTWFyc2hhbGwnLFxuICAgICdKZWZmcmV5IEFsdmFyZXonLFxuICAgICdLYXRobGVlbiBXcmlnaHQnLFxuICAgICdBbWFuZGEgR3JhaGFtJyxcbiAgICAnQWxiZXJ0IEhhbGwnLFxuICAgICdNYXR0aGV3IEtlbGx5JyxcbiAgICAnU2FyYWggTGl0dGxlJyxcbiAgICAnTWljaGVsbGUgU3Rld2FydCcsXG4gICAgJ0NoZXJ5bCBSeWFuJyxcbiAgICAnSm9uYXRoYW4gTWVkaW5hJyxcbiAgICAnSmVzc2UgVGhvbWFzJyxcbiAgICAnRGlhbmUgQ3J1eicsXG4gICAgJ1N0ZXZlbiBFdmFucycsXG4gICAgJ0FydGh1ciBKb2huc3RvbicsXG4gICAgJ01hcmdhcmV0IE93ZW5zJyxcbiAgICAnSnVhbiBBcm5vbGQnLFxuICAgICdKb3ljZSBLZWxsZXknLFxuICAgICdNYXJpbHluIEpvbmVzJyxcbiAgICAnUnlhbiBNYXJ0aW4nLFxuICAgICdBbWFuZGEgQ29sZScsXG4gICAgJ0ZyYW5jZXMgQmFybmVzJyxcbiAgICAnSmFtZXMgSmFjb2JzJyxcbiAgICAnR2VyYWxkIE9saXZlcicsXG4gICAgJ1NhcmEgR2FyY2lhJyxcbiAgICAnU2FyYSBXb29kJyxcbiAgICAnSm9hbiBSb2JpbnNvbicsXG4gICAgJ1RlcnJ5IEdhcnphJyxcbiAgICAnTGlzYSBDb29rJyxcbiAgICAnU2FyYWggSHVudCcsXG4gICAgJ1dhbmRhIFJpY2UnLFxuICAgICdEb25hbGQgV2FyZCcsXG4gICAgJ0xpbGxpYW4gSGFuc2VuJyxcbiAgICAnQmV0dHkgUGV0ZXJzb24nLFxuICAgICdEYXZpZCBSb2JpbnNvbicsXG4gICAgJ0FkYW0gUm9zcycsXG4gICAgJ0thdGhsZWVuIFJleW5vbGRzJyxcbiAgICAnQm9iYnkgUml2ZXJhJyxcbiAgICAnSGVsZW4gSmVua2lucycsXG4gICAgJ0xhcnJ5IEJyb3duJyxcbiAgICAnTWFyaWx5biBGb3gnLFxuICAgICdMb3JpIFJpdmVyYScsXG4gICAgJ0V2ZWx5biBSYXknLFxuICAgICdTdGV2ZW4gR29yZG9uJyxcbiAgICAnRGVubmlzIEtlbGx5JyxcbiAgICAnQ2hyaXN0aW5lIEJlbGwnLFxuICAgICdNYXJpYSBNb3JyaXNvbicsXG4gICAgJ0JvYmJ5IFJleW5vbGRzJyxcbiAgICAnQ2xhcmVuY2UgU21pdGgnLFxuICAgICdMb2lzIFZhc3F1ZXonLFxuICAgICdBbnRvbmlvIEh1Z2hlcycsXG4gICAgJ0thdGh5IERheScsXG4gICAgJ0RpYW5hIEJlbm5ldHQnLFxuICAgICdOYW5jeSBTY2htaWR0JyxcbiAgICAnSmVyZW15IEdvbnphbGVzJyxcbiAgICAnUGV0ZXIgTWFyc2hhbGwnLFxuICAgICdEYXZpZCBCYXJuZXMnLFxuICAgICdDaGFybGVzIERlYW4nLFxuICAgICdTaGF3biBDb29rJyxcbiAgICAnTWFyZ2FyZXQgQmlzaG9wJyxcbiAgICAnTWFyaWUgSGlsbCcsXG4gICAgJ1J1dGggRm9zdGVyJyxcbiAgICAnQ2hyaXN0aW5lIEtuaWdodCcsXG4gICAgJ01hcmllIFJvbWVybycsXG4gICAgJ0p1bGllIEZyZWVtYW4nLFxuICAgICdNaWxkcmVkIENyYXdmb3JkJyxcbiAgICAnQnJpYW4gQmVubmV0dCcsXG4gICAgJ0p1YW4gSG93YXJkJyxcbiAgICAnTG91aXNlIEhvd2VsbCcsXG4gICAgJ0FudGhvbnkgU2ltcHNvbicsXG4gICAgJ05pY29sZSBTdG9uZScsXG4gICAgJ0tlbm5ldGggSGlsbCcsXG4gICAgJ0plc3NlIFdhdHNvbicsXG4gICAgJ0phbmUgUmFtb3MnLFxuICAgICdMaW5kYSBTdGVwaGVucycsXG4gICAgJ1Njb3R0IE1vb3JlJyxcbiAgICAnVmljdG9yIFJheScsXG4gICAgJ0FsYmVydCBCdXRsZXInLFxuICAgICdFcm5lc3QgUmljaGFyZHMnLFxuICAgICdEYW5pZWwgU3VsbGl2YW4nLFxuICAgICdBbXkgU2ltcHNvbicsXG4gICAgJ0hlYXRoZXIgS2VsbHknLFxuICAgICdEZW5pc2UgTG9uZycsXG4gICAgJ0Jvbm5pZSBIaWNrcycsXG4gICAgJ1JveSBXYWduZXInLFxuICAgICdMYXdyZW5jZSBQYXluZScsXG4gICAgJ0FzaGxleSBKZW5raW5zJyxcbiAgICAnSnVsaWUgS2VubmVkeScsXG4gICAgJ01pY2hlbGxlIFBlcnJ5JyxcbiAgICAnSmFzb24gU3VsbGl2YW4nLFxuICAgICdTZWFuIEhhbWlsdG9uJyxcbiAgICAnQWRhbSBQYXluZScsXG4gICAgJ01hcmlseW4gTWVkaW5hJyxcbiAgICAnTWFyZ2FyZXQgQ294JyxcbiAgICAnRWFybCBGbG9yZXMnLFxuICAgICdGcmFuayBNaWxscycsXG4gICAgJ0FudG9uaW8gSmFtZXMnLFxuICAgICdCcnVjZSBWYXNxdWV6JyxcbiAgICAnUGF0cmljaWEgV2FnbmVyJyxcbiAgICAnSm95Y2UgSHVudCcsXG4gICAgJ0RpYW5hIEd1dGllcnJleicsXG4gICAgJ0thdGhyeW4gR29uemFsZXonLFxuICAgICdQYXVsYSBSdWl6JyxcbiAgICAnTWF0dGhldyBCYXJuZXMnLFxuICAgICdTdGV2ZSBQcmljZScsXG4gICAgJ1BhdWxhIFBlcmtpbnMnLFxuICAgICdKb3ljZSBBbGxlbicsXG4gICAgJ1BhbWVsYSBHYXJjaWEnLFxuICAgICdUb2RkIFBhcmtlcicsXG4gICAgJ0VtaWx5IFJvc3MnLFxuICAgICdSdWJ5IE1hcnNoYWxsJyxcbiAgICAnTWFyaWx5biBIYXJwZXInLFxuICAgICdSYW5keSBGb3N0ZXInLFxuICAgICdSYW5keSBXYWxrZXInLFxuICAgICdXYWx0ZXIgRGlheicsXG4gICAgJ0RhbmllbCBSeWFuJyxcbiAgICAnUmF5bW9uZCBHb3Jkb24nLFxuICAgICdIZWxlbiBIdWdoZXMnLFxuICAgICdDaHJpc3RvcGhlciBBbGV4YW5kZXInLFxuICAgICdUZXJlc2EgTWNkb25hbGQnLFxuICAgICdBbGFuIFdpbGxpYW1zb24nLFxuICAgICdLYXRoeSBBbmRlcnNvbicsXG4gICAgJ1JpY2hhcmQgV2FycmVuJyxcbiAgICAnSmFtZXMgUmFtaXJleicsXG4gICAgJ0p1bGllIEJhaWxleScsXG4gICAgJ1RvZGQgSmFjb2JzJyxcbiAgICAnSm9uYXRoYW4gRWxsaXMnLFxuICAgICdKYW5lIENhcnJvbGwnLFxuICAgICdMYXdyZW5jZSBCdXRsZXInLFxuICAgICdSYW5keSBTaW1wc29uJyxcbiAgICAnUGV0ZXIgU21pdGgnLFxuICAgICdSb25hbGQgQ3VubmluZ2hhbScsXG4gICAgJ1N1c2FuIFJpY2hhcmRzJyxcbiAgICAnSm9zZXBoIFBldGVyc29uJyxcbiAgICAnSm9zZSBPbHNvbicsXG4gICAgJ1BoeWxsaXMgUm9kcmlndWV6JyxcbiAgICAnTGlsbGlhbiBHaWxiZXJ0JyxcbiAgICAnQnJpYW4gSGlja3MnLFxuICAgICdDeW50aGlhIEJlcnJ5JyxcbiAgICAnSmVzc2ljYSBNYXNvbicsXG4gICAgJ05pY29sZSBXZXN0JyxcbiAgICAnU2VhbiBNZW5kb3phJyxcbiAgICAnSm9zZXBoIFdpbHNvbicsXG4gICAgJ1BldGVyIExpdHRsZScsXG4gICAgJ0tlbm5ldGggQnVya2UnLFxuICAgICdNYXR0aGV3IEdyYW50JyxcbiAgICAnTGlzYSBCbGFjaycsXG4gICAgJ01hcmlseW4gR29yZG9uJyxcbiAgICAnQW5uIEtlbm5lZHknLFxuICAgICdKb25hdGhhbiBIdWRzb24nLFxuICAgICdHZXJhbGQgV2FsbGFjZScsXG4gICAgJ0Rvcm90aHkgUmljaGFyZHMnLFxuICAgICdQaGlsaXAgR3JhbnQnLFxuICAgICdOYW5jeSBNZW5kb3phJyxcbiAgICAnQXNobGV5IFNwZW5jZXInLFxuICAgICdUaW1vdGh5IFNwZW5jZXInLFxuICAgICdKYW5lIFNpbXBzb24nLFxuICAgICdEb3JvdGh5IEhlcm5hbmRleicsXG4gICAgJ1N0ZXBoYW5pZSBTdG9uZScsXG4gICAgJ1JhbHBoIEhlcm5hbmRleicsXG4gICAgJ01hcmlhIEdlb3JnZScsXG4gICAgJ0phY3F1ZWxpbmUgQnVybnMnLFxuICAgICdKdWRpdGggTGV3aXMnLFxuICAgICdBbnRvbmlvIE1pdGNoZWxsJyxcbiAgICAnTGlzYSBQaGlsbGlwcycsXG4gICAgJ1NoaXJsZXkgS25pZ2h0JyxcbiAgICAnRXJpYyBQcmljZScsXG4gICAgJ1JheW1vbmQgS25pZ2h0JyxcbiAgICAnQ2hyaXMgUGF0dGVyc29uJyxcbiAgICAnQW5uZSBHcmlmZmluJyxcbiAgICAnS2VubmV0aCBTY2htaWR0JyxcbiAgICAnTG9yaSBGb3N0ZXInLFxuICAgICdBbm5pZSBIdW50ZXInLFxuICAgICdTaGlybGV5IE93ZW5zJyxcbiAgICAnS2F0aGVyaW5lIFJvYmVydHNvbicsXG4gICAgJ0pvc2h1YSBLZWxseScsXG4gICAgJ0ZyYW5rIEJyeWFudCcsXG4gICAgJ0ZyYW5jZXMgQ2FtcGJlbGwnLFxuICAgICdKYW1lcyBCdXJ0b24nLFxuICAgICdSYW5keSBDcnV6JyxcbiAgICAnQ2Fyb2x5biBTaGF3JyxcbiAgICAnQW1hbmRhIEJveWQnLFxuICAgICdKZXJlbXkgTW9yZW5vJyxcbiAgICAnU3RlcGhhbmllIEZpc2hlcicsXG4gICAgJ1Jvc2UgQWxleGFuZGVyJyxcbiAgICAnS2FyZW4gRGF5JyxcbiAgICAnQ2xhcmVuY2UgT2xzb24nLFxuICAgICdSb3NlIFdhcmQnLFxuICAgICdBc2hsZXkgUm9iaW5zb24nLFxuICAgICdBYXJvbiBCdXJucycsXG4gICAgJ0plZmZyZXkgUGFya2VyJyxcbiAgICAnVGhlcmVzYSBIYXdraW5zJyxcbiAgICAnRG9uYWxkIFdoZWVsZXInLFxuICAgICdTdGVwaGVuIE1vcmVubycsXG4gICAgJ0NhcmxvcyBNYXJzaGFsbCcsXG4gICAgJ0FsaWNlIE1pdGNoZWxsJyxcbiAgICAnUGF0cmljayBMZXdpcycsXG4gICAgJ0xvdWlzIEdyZWVuZScsXG4gICAgJ0FubmUgU3RlcGhlbnMnLFxuICAgICdIb3dhcmQgQmxhY2snLFxuICAgICdNaWNoYWVsIFNjaG1pZHQnLFxuICAgICdKb2FuIE5ndXllbicsXG4gICAgJ0JyZW5kYSBSb2JlcnRzJyxcbiAgICAnTWFyayBCdXRsZXInLFxuICAgICdSb2JpbiBGdWxsZXInLFxuICAgICdLYXRoeSBIdWRzb24nLFxuICAgICdTYW11ZWwgR29uemFsZXonLFxuICAgICdCYXJiYXJhIFJ1aXonLFxuICAgICdGcmVkIFdlbGNoJyxcbiAgICAnQWFyb24gTW9udGdvbWVyeScsXG4gICAgJ01hcnkgSGFycmlzb24nLFxuICAgICdHcmVnb3J5IFNpbXBzb24nLFxuICAgICdLZWxseSBXYXRzb24nLFxuICAgICdOaWNob2xhcyBSb3NzJyxcbiAgICAnUGFtZWxhIEZlcm5hbmRleicsXG4gICAgJ0ZyYW5jZXMgUG9ydGVyJyxcbiAgICAnSGFycnkgQ29sZW1hbicsXG4gICAgJ01hcmdhcmV0IFJ1c3NlbGwnLFxuICAgICdXYWx0ZXIgR3V0aWVycmV6JyxcbiAgICAnS2F0aHJ5biBGaXNoZXInLFxuICAgICdKb2FuIFNpbXMnLFxuICAgICdTY290dCBDb2xsaW5zJyxcbiAgICAnQ2hyaXMgQ29sZScsXG4gICAgJ0VtaWx5IFdlc3QnLFxuICAgICdTaGF3biBFZHdhcmRzJyxcbiAgICAnSm9obm55IEhlcm5hbmRleicsXG4gICAgJ0FubmUgV29vZCcsXG4gICAgJ0NhdGhlcmluZSBDb3gnLFxuICAgICdGcmFuayBSb2JpbnNvbicsXG4gICAgJ0dyZWdvcnkgUG93ZWxsJyxcbiAgICAnQnJpYW4gS25pZ2h0JyxcbiAgICAnQ2Fyb2x5biBTbWl0aCcsXG4gICAgJ0pvZSBBbmRlcnNvbicsXG4gICAgJ0RlbmlzZSBNZXllcicsXG4gICAgJ05pY29sZSBHcmFudCcsXG4gICAgJ0xvdWlzIEZpZWxkcycsXG4gICAgJ0JyZW5kYSBCdXJ0b24nLFxuICAgICdBc2hsZXkgSmVua2lucycsXG4gICAgJ0xpbmRhIExhd3NvbicsXG4gICAgJ1NhcmEgUmljaGFyZHNvbicsXG4gICAgJ05hbmN5IFBvd2VsbCcsXG4gICAgJ0phbmljZSBIb2xtZXMnLFxuICAgICdWaWN0b3IgTmd1eWVuJyxcbiAgICAnUGFtZWxhIEJyYWRsZXknLFxuICAgICdCaWxseSBIdWdoZXMnLFxuICAgICdSYW5keSBCdXJ0b24nLFxuICAgICdIZWF0aGVyIERpeG9uJyxcbiAgICAnS2ltYmVybHkgQmxhY2snLFxuICAgICdLZW5uZXRoIFN0b25lJyxcbiAgICAnSmFuZSBHdXRpZXJyZXonLFxuICAgICdBbGFuIEF1c3RpbicsXG4gICAgJ0NyYWlnIEF1c3RpbicsXG4gICAgJ0RlYm9yYWggTW9yYWxlcycsXG4gICAgJ1JheW1vbmQgVGhvbWFzJyxcbiAgICAnQ2hlcnlsIFBheW5lJyxcbiAgICAnS2F0aGVyaW5lIFdpbGxpcycsXG4gICAgJ1RpbmEgQnJhZGxleScsXG4gICAgJ1NlYW4gV3JpZ2h0JyxcbiAgICAnR2VvcmdlIEdvbnphbGV6JyxcbiAgICAnSm9obm55IFdpbGxpcycsXG4gICAgJ0NocmlzdGluZSBIaWxsJyxcbiAgICAnSm9zaHVhIEFsbGVuJyxcbiAgICAnTWljaGFlbCBXb29kcycsXG4gICAgJ1JvbmFsZCBSeWFuJyxcbiAgICAnUGF1bGEgRmVybmFuZGV6JyxcbiAgICAnQmFyYmFyYSBSaXZlcmEnLFxuICAgICdBc2hsZXkgQmxhY2snLFxuICAgICdSdXNzZWxsIFZhc3F1ZXonLFxuICAgICdFYXJsIENhbXBiZWxsJyxcbiAgICAnTG9pcyBIZW5kZXJzb24nLFxuICAgICdTaGlybGV5IExvcGV6JyxcbiAgICAnUmFuZHkgTGF3c29uJyxcbiAgICAnS2V2aW4gV2VhdmVyJyxcbiAgICAnRW1pbHkgQXVzdGluJyxcbiAgICAnS2VsbHkgSGFydmV5JyxcbiAgICAnSmVubmlmZXIgR2FycmV0dCcsXG4gICAgJ0V2ZWx5biBGcmVlbWFuJyxcbiAgICAnUnVieSBQZXJraW5zJyxcbiAgICAnQ2hyaXN0b3BoZXIgSGFtaWx0b24nLFxuICAgICdTYXJhaCBPbHNvbicsXG4gICAgJ01pY2hhZWwgS2VubmVkeScsXG4gICAgJ1NhbXVlbCBFdmFucycsXG4gICAgJ1RlcmVzYSBTcGVuY2VyJyxcbiAgICAnS2F0aHJ5biBNb3JyaXMnLFxuICAgICdMaWxsaWFuIENhcnBlbnRlcicsXG4gICAgJ0p1c3RpbiBHcmVlbmUnLFxuICAgICdSb25hbGQgU2NvdHQnLFxuICAgICdKdXN0aW4gU3RvbmUnLFxuICAgICdFbGl6YWJldGggRmlzaGVyJyxcbiAgICAnVGluYSBDb2xsaW5zJyxcbiAgICAnU2hpcmxleSBXcmlnaHQnLFxuICAgICdLYXRobGVlbiBTdGVwaGVucycsXG4gICAgJ0pvc2UgSmFja3NvbicsXG4gICAgJ0pvbmF0aGFuIEZyZWVtYW4nLFxuICAgICdKZWFuIE11cnJheScsXG4gICAgJ0dhcnkgRm9zdGVyJyxcbiAgICAnQW5uZSBOZ3V5ZW4nLFxuICAgICdKb3NlIEZlcm5hbmRleicsXG4gICAgJ1JheW1vbmQgUmV5ZXMnLFxuICAgICdNaWxkcmVkIFJvZHJpZ3VleicsXG4gICAgJ1Jvc2UgQ2FycicsXG4gICAgJ0pvaG4gTWFyc2hhbGwnLFxuICAgICdKZXNzaWNhIFdpbGxpcycsXG4gICAgJ1BhdWwgQmFua3MnLFxuICAgICdTdGV2ZSBXaWxsaWFtcycsXG4gICAgJ1JvbmFsZCBDYXJyb2xsJyxcbiAgICAnUmFuZHkgTWlsbHMnLFxuICAgICdBYXJvbiBHb256YWxleicsXG4gICAgJ0VtaWx5IE1pdGNoZWxsJyxcbiAgICAnQ3ludGhpYSBQb3J0ZXInLFxuICAgICdIYXJvbGQgU3BlbmNlcicsXG4gICAgJ0pvaG5ueSBSZXlub2xkcycsXG4gICAgJ0dlb3JnZSBBcm5vbGQnLFxuICAgICdXYW5kYSBXZXN0JyxcbiAgICAnTGF1cmEgU3RvbmUnLFxuICAgICdMb2lzIFNpbXBzb24nLFxuICAgICdLZW5uZXRoIFdpbHNvbicsXG4gICAgJ0NhcmxvcyBCcm93bicsXG4gICAgJ0NocmlzdGluZSBCcmFkbGV5JyxcbiAgICAnUmF5bW9uZCBHb256YWxlcycsXG4gICAgJ0pvYW4gQWRhbXMnLFxuICAgICdTYXJhIFdlYmInLFxuICAgICdKdWxpZSBGaXNoZXInLFxuICAgICdBbXkgVmFzcXVleicsXG4gICAgJ1N0ZXZlIE1leWVyJyxcbiAgICAnQ2FybG9zIFBldGVycycsXG4gICAgJ0p1ZGl0aCBGaXNoZXInLFxuICAgICdQaHlsbGlzIFdpbGxpYW1zJyxcbiAgICAnRG9uYWxkIE15ZXJzJyxcbiAgICAnSmVubmlmZXIgQ29sbGlucycsXG4gICAgJ0RlYm9yYWggSGFycGVyJyxcbiAgICAnUmFscGggV2VsbHMnLFxuICAgICdCZXR0eSBIb3dlbGwnLFxuICAgICdCcmFuZG9uIEZyYXppZXInLFxuICAgICdTYXJhIFNoYXcnLFxuICAgICdSdWJ5IEFsdmFyZXonLFxuICAgICdKdXN0aW4gQ2FtcGJlbGwnLFxuICAgICdTYW5kcmEgUGF0dGVyc29uJyxcbiAgICAnQWxhbiBZb3VuZycsXG4gICAgJ1RlcmVzYSBNb3JyaXMnLFxuICAgICdFdWdlbmUgSGFuc29uJyxcbiAgICAnRGF2aWQgTGV3aXMnLFxuICAgICdFYXJsIEVkd2FyZHMnLFxuICAgICdJcmVuZSBTdGV2ZW5zJyxcbiAgICAnSmFjcXVlbGluZSBIYW5zZW4nLFxuICAgICdDaHJpc3RvcGhlciBXYWduZXInLFxuICAgICdFZHdhcmQgR2VvcmdlJyxcbiAgICAnS2F0aGVyaW5lIEFsdmFyZXonLFxuICAgICdDaHJpcyBEYXZpcycsXG4gICAgJ0p1YW4gRmVybmFuZGV6JyxcbiAgICAnVGhlcmVzYSBXb29kcycsXG4gICAgJ0p1c3RpbiBNY2NveScsXG4gICAgJ0RhdmlkIFJleWVzJyxcbiAgICAnS2ltYmVybHkgUmV5bm9sZHMnLFxuICAgICdBbm5lIExvbmcnLFxuICAgICdLaW1iZXJseSBXaWxzb24nLFxuICAgICdBbWFuZGEgSGlsbCcsXG4gICAgJ0plZmZyZXkgSGFtaWx0b24nLFxuICAgICdTdGVwaGFuaWUgRnVsbGVyJyxcbiAgICAnSmVycnkgUGF0dGVyc29uJyxcbiAgICAnTG9pcyBZb3VuZycsXG4gICAgJ1JvYmluIFN0ZXBoZW5zJyxcbiAgICAnR2VvcmdlIEJhaWxleScsXG4gICAgJ1NlYW4gQnJvd24nLFxuICAgICdUaGVyZXNhIE1pbGxzJyxcbiAgICAnTWFyayBWYXNxdWV6JyxcbiAgICAnSm9hbiBSb21lcm8nLFxuICAgICdOYW5jeSBUYXlsb3InLFxuICAgICdKdXN0aW4gUmlsZXknLFxuICAgICdFcmljIEhhcnQnLFxuICAgICdKb3NlcGggQnVybnMnLFxuICAgICdSYW5keSBNY2RvbmFsZCcsXG4gICAgJ01hcnRpbiBHaWJzb24nLFxuICAgICdQYXVsYSBOZWxzb24nLFxuICAgICdNYXR0aGV3IFJpbGV5JyxcbiAgICAnTWFyeSBNb3JnYW4nLFxuICAgICdEZW5pc2UgQ2FtcGJlbGwnLFxuICAgICdQaHlsbGlzIFJhbWlyZXonLFxuICAgICdKYWNxdWVsaW5lIFdlYmInLFxuICAgICdEZW5uaXMgQnVybnMnLFxuICAgICdDaHJpc3RpbmUgVHVybmVyJyxcbiAgICAnTGlzYSBKYW1lcycsXG4gICAgJ1NhbXVlbCBNb3Jlbm8nLFxuICAgICdEYW5pZWwgQnVybnMnLFxuICAgICdTdGVwaGVuIEJhbmtzJyxcbiAgICAnS2F0aGVyaW5lIFdhc2hpbmd0b24nLFxuICAgICdFbWlseSBXaWxzb24nLFxuICAgICdEZW5uaXMgUm9nZXJzJyxcbiAgICAnU2VhbiBTdG9uZScsXG4gICAgJ0RhdmlkIFdhbGxhY2UnLFxuICAgICdOb3JtYSBLZWxseScsXG4gICAgJ01pbGRyZWQgQm95ZCcsXG4gICAgJ0thdGhyeW4gQ29sbGlucycsXG4gICAgJ1BoaWxsaXAgU2FuZGVycycsXG4gICAgJ0pvaG4gR2FyemEnLFxuICAgICdCZXR0eSBXZWxjaCcsXG4gICAgJ1N0ZXBoZW4gSmFja3NvbicsXG4gICAgJ0dlcmFsZCBDcmF3Zm9yZCcsXG4gICAgJ0pvc2VwaCBGb3JkJyxcbiAgICAnQmFyYmFyYSBNdXJyYXknLFxuICAgICdEZW5uaXMgRGF2aXMnLFxuICAgICdSb2JpbiBQcmljZScsXG4gICAgJ0phY2sgQ3Jhd2ZvcmQnLFxuICAgICdSaWNoYXJkIE1jY295JyxcbiAgICAnTGluZGEgTW9vcmUnLFxuICAgICdNZWxpc3NhIE5pY2hvbHMnLFxuICAgICdMaXNhIExvcGV6JyxcbiAgICAnQ2F0aGVyaW5lIE1vbnRnb21lcnknLFxuICAgICdKYW5lIEJyYWRsZXknLFxuICAgICdFdWdlbmUgQmFua3MnLFxuICAgICdBbGljZSBLZWxseScsXG4gICAgJ0plcnJ5IEZvd2xlcicsXG4gICAgJ1JpY2hhcmQgQmFybmVzJyxcbiAgICAnU2NvdHQgT2xzb24nLFxuICAgICdKb3ljZSBEYXknLFxuICAgICdIb3dhcmQgUGFya2VyJyxcbiAgICAnQm9ubmllIFZhc3F1ZXonLFxuICAgICdEb3JvdGh5IE1vbnRnb21lcnknLFxuICAgICdCb2JieSBCcmFkbGV5JyxcbiAgICAnSm9zZXBoIE1pdGNoZWxsJyxcbiAgICAnUGF1bCBMeW5jaCcsXG4gICAgJ1J1c3NlbGwgU3RlcGhlbnMnLFxuICAgICdXYWx0ZXIgVHVja2VyJyxcbiAgICAnQ2hyaXN0aW5hIENsYXJrJyxcbiAgICAnV2FuZGEgV2VhdmVyJyxcbiAgICAnTWVsaXNzYSBDYW1wYmVsbCcsXG4gICAgJ0xvdWlzZSBNaXRjaGVsbCcsXG4gICAgJ0thdGhlcmluZSBBcm5vbGQnLFxuICAgICdBbGFuIENhcnJvbGwnLFxuICAgICdKYW5lIEJhcm5lcycsXG4gICAgJ1dheW5lIEpvcmRhbicsXG4gICAgJ05pY2hvbGFzIFdoZWVsZXInLFxuICAgICdUZXJyeSBIYW5zZW4nLFxuICAgICdKZXJyeSBDaGFwbWFuJyxcbiAgICAnSmltbXkgRmlzaGVyJyxcbiAgICAnSGVucnkgQ2hhdmV6JyxcbiAgICAnQ3ludGhpYSBTaW1tb25zJyxcbiAgICAnRGF2aWQgU21pdGgnLFxuICAgICdDaGVyeWwgUm9iZXJ0c29uJyxcbiAgICAnQnJpYW4gRGlheicsXG4gICAgJ1NoYXduIE5ndXllbicsXG4gICAgJ0plcmVteSBXZWxjaCcsXG4gICAgJ0dyZWdvcnkgTWFyc2hhbGwnLFxuICAgICdKZXNzaWNhIFJ1aXonLFxuICAgICdKb3ljZSBIdW50ZXInLFxuICAgICdKb2UgR2VvcmdlJyxcbiAgICAnTmFuY3kgV2VsY2gnLFxuICAgICdKb3NlcGggQXJtc3Ryb25nJyxcbiAgICAnSm9zZSBMYXdyZW5jZScsXG4gICAgJ0JvYmJ5IFBoaWxsaXBzJyxcbiAgICAnSmFjcXVlbGluZSBKb2huc29uJyxcbiAgICAnRG9ubmEgRmllbGRzJyxcbiAgICAnU3RlcGhlbiBTbnlkZXInLFxuICAgICdDaHJpcyBCZXJyeScsXG4gICAgJ0NocmlzdGluYSBWYXNxdWV6JyxcbiAgICAnRGVuaXNlIE5lbHNvbicsXG4gICAgJ1NoYXJvbiBIaWxsJyxcbiAgICAnRGVuaXNlIE1vb3JlJyxcbiAgICAnTWFyZ2FyZXQgTWFyc2hhbGwnLFxuICAgICdCcmlhbiBDb29rJyxcbiAgICAnVmlyZ2luaWEgRGFuaWVscycsXG4gICAgJ1JvYmVydCBXYXNoaW5ndG9uJyxcbiAgICAnSGVsZW4gS2VubmVkeScsXG4gICAgJ01hcmlhIE9saXZlcicsXG4gICAgJ0plc3NlIFN0ZXdhcnQnLFxuICAgICdFbWlseSBFbGxpcycsXG4gICAgJ0JlbmphbWluIEJ1dGxlcicsXG4gICAgJ0JyYW5kb24gUGFya2VyJyxcbiAgICAnQnJhbmRvbiBXcmlnaHQnLFxuICAgICdEYXZpZCBSZWlkJyxcbiAgICAnVG9kZCBMb25nJyxcbiAgICAnRWFybCBHcmFudCcsXG4gICAgJ0p1bGlhIE1hcnRpbmV6JyxcbiAgICAnUGh5bGxpcyBHb256YWxleicsXG4gICAgJ0FubmUgUm9nZXJzJyxcbiAgICAnUmViZWNjYSBUYXlsb3InLFxuICAgICdSb2JpbiBNb3Jlbm8nLFxuICAgICdHYXJ5IFdhcmQnLFxuICAgICdCcnVjZSBCZWxsJyxcbiAgICAnRnJlZCBCb3dtYW4nLFxuICAgICdTdGV2ZW4gQWxleGFuZGVyJyxcbiAgICAnRGFuaWVsIEFsbGVuJyxcbiAgICAnQmV2ZXJseSBIZW5kZXJzb24nLFxuICAgICdNaWxkcmVkIFN1bGxpdmFuJyxcbiAgICAnU2FyYWggQ29vcGVyJyxcbiAgICAnRG9uYWxkIFJvYmVydHNvbicsXG4gICAgJ1BhdWxhIEdyYWhhbScsXG4gICAgJ1RhbW15IFdhbGxhY2UnLFxuICAgICdKb2FuIExvcGV6JyxcbiAgICAnTGF3cmVuY2UgSGFtaWx0b24nLFxuICAgICdKYWNxdWVsaW5lIEdhcnJldHQnLFxuICAgICdOb3JtYSBQYXJrZXInLFxuICAgICdGcmVkIFByaWNlJyxcbiAgICAnS2V2aW4gQnV0bGVyJyxcbiAgICAnTG9pcyBXYXNoaW5ndG9uJyxcbiAgICAnSm9zaHVhIEphbWVzJyxcbiAgICAnQXNobGV5IEhheWVzJyxcbiAgICAnQmFyYmFyYSBCcmFkbGV5JyxcbiAgICAnR2VvcmdlIE1hdHRoZXdzJyxcbiAgICAnTmljaG9sYXMgTXllcnMnLFxuICAgICdDaHJpcyBEZWFuJyxcbiAgICAnQm9iYnkgV2FsbGFjZScsXG4gICAgJ0VtaWx5IFBvd2VsbCcsXG4gICAgJ05hbmN5IFBldGVycycsXG4gICAgJ0NocmlzdG9waGVyIEV2YW5zJyxcbiAgICAnU2hhd24gTW9udGdvbWVyeScsXG4gICAgJ0ppbW15IFJhbW9zJyxcbiAgICAnUmFuZHkgSGF3a2lucycsXG4gICAgJ0RlYm9yYWggU2hhdycsXG4gICAgJ1JvbmFsZCBIYXJ0JyxcbiAgICAnTWlsZHJlZCBEYXknLFxuICAgICdSdXNzZWxsIEZpZWxkcycsXG4gICAgJ1BoaWxpcCBQYWxtZXInLFxuICAgICdSYWxwaCBOaWNob2xzJyxcbiAgICAnQ2Fyb2wgQXJtc3Ryb25nJyxcbiAgICAnQW5uaWUgQ29sZScsXG4gICAgJ1BhdHJpY2sgU255ZGVyJyxcbiAgICAnQ2hyaXN0aW5hIER1bmNhbicsXG4gICAgJ0tlbm5ldGggRGlheicsXG4gICAgJ01lbGlzc2EgR3JhbnQnLFxuICAgICdSaWNoYXJkIEJlbm5ldHQnLFxuICAgICdXYWx0ZXIgTWFydGluJyxcbiAgICAnS2F0aGVyaW5lIFBhbG1lcicsXG4gICAgJ0xpbGxpYW4gU3VsbGl2YW4nLFxuICAgICdKb2FuIFBlcmV6JyxcbiAgICAnU2hhcm9uIEhheWVzJyxcbiAgICAnU3RldmUgRXZhbnMnLFxuICAgICdFcmljIE93ZW5zJyxcbiAgICAnUm9uYWxkIEZ1bGxlcicsXG4gICAgJ0RvdWdsYXMgQXJub2xkJyxcbiAgICAnSnVkaXRoIEtpbmcnLFxuICAgICdMaXNhIE1pdGNoZWxsJyxcbiAgICAnRGVib3JhaCBNeWVycycsXG4gICAgJ05hbmN5IExhd3NvbicsXG4gICAgJ01lbGlzc2EgV2F0a2lucycsXG4gICAgJ0Rlbm5pcyBIZW5yeScsXG4gICAgJ0RlYnJhIFN0ZXBoZW5zJyxcbiAgICAnU2hhd24gVG9ycmVzJyxcbiAgICAnTWFyZ2FyZXQgTGFuZScsXG4gICAgJ1ZpY3RvciBBbmRyZXdzJyxcbiAgICAnQW50b25pbyBEZWFuJyxcbiAgICAnSm9zZSBXaWxzb24nLFxuICAgICdUaG9tYXMgTXllcnMnLFxuICAgICdBbGFuIFdlc3QnLFxuICAgICdMaW5kYSBCcm9va3MnLFxuICAgICdGcmFuY2VzIFR1cm5lcicsXG4gICAgJ0NhcmwgQWx2YXJleicsXG4gICAgJ1BldGVyIEZvc3RlcicsXG4gICAgJ1NoaXJsZXkgR3JheScsXG4gICAgJ0xvdWlzZSBQaGlsbGlwcycsXG4gICAgJ1NlYW4gTWlsbHMnLFxuICAgICdKYW1lcyBIYW1pbHRvbicsXG4gICAgJ1RoZXJlc2EgU21pdGgnLFxuICAgICdBZGFtIE5pY2hvbHMnLFxuICAgICdKYWNrIENvbGxpbnMnLFxuICAgICdBbm5lIEFsbGVuJyxcbiAgICAnV2lsbGllIEphbWVzJyxcbiAgICAnTGlsbGlhbiBQb3dlbGwnLFxuICAgICdXaWxsaWFtIEd1dGllcnJleicsXG4gICAgJ0NsYXJlbmNlIFBlcmtpbnMnLFxuICAgICdBbmRyZWEgTG9uZycsXG4gICAgJ0RvcmlzIEVkd2FyZHMnLFxuICAgICdTdGV2ZW4gV2lsc29uJyxcbiAgICAnRGFuaWVsIFdhdHNvbicsXG4gICAgJ0hvd2FyZCBHdXRpZXJyZXonLFxuICAgICdGcmVkIEphY2tzb24nLFxuICAgICdKb3ljZSBXZWxscycsXG4gICAgJ0phbmV0IFdvb2RzJyxcbiAgICAnTmFuY3kgQXVzdGluJyxcbiAgICAnQ3ludGhpYSBGb3gnLFxuICAgICdSb2JpbiBGb3dsZXInLFxuICAgICdEZW5pc2UgQ2FydGVyJyxcbiAgICAnVGluYSBXZWxscycsXG4gICAgJ0V1Z2VuZSBNb3JnYW4nLFxuICAgICdMaWxsaWFuIEZyZWVtYW4nLFxuICAgICdUYW1teSBKb2huc3RvbicsXG4gICAgJ05hbmN5IENhc3RpbGxvJyxcbiAgICAnUGhpbGlwIEphY29icycsXG4gICAgJ0RpYW5lIEZveCcsXG4gICAgJ1JvZ2VyIEhhd2tpbnMnLFxuICAgICdQaGlsaXAgUml2ZXJhJyxcbiAgICAnVGltb3RoeSBSYXknLFxuICAgICdXaWxsaWFtIFJpbGV5JyxcbiAgICAnR2VyYWxkIFZhc3F1ZXonLFxuICAgICdSaWNoYXJkIEdvbnphbGV6JyxcbiAgICAnU2hpcmxleSBCcm93bicsXG4gICAgJ0VsaXphYmV0aCBQaWVyY2UnLFxuICAgICdFYXJsIFdlbGNoJyxcbiAgICAnTWFyZ2FyZXQgSGFsbCcsXG4gICAgJ0VybmVzdCBNdXJwaHknLFxuICAgICdKb3NodWEgV3JpZ2h0JyxcbiAgICAnQW1hbmRhIEh1bnQnLFxuICAgICdXaWxsaWUgQnVydG9uJyxcbiAgICAnVGluYSBIYWxsJyxcbiAgICAnSGFycnkgUGVya2lucycsXG4gICAgJ01hcmllIEhhbGwnLFxuICAgICdKdWxpYSBTdGVwaGVucycsXG4gICAgJ01hdHRoZXcgR29yZG9uJyxcbiAgICAnSmVyZW15IFNueWRlcicsXG4gICAgJ0dyZWdvcnkgRnJlZW1hbicsXG4gICAgJ0dyZWdvcnkgRmVybmFuZGV6JyxcbiAgICAnQW5uIEphY2tzb24nLFxuICAgICdKZWZmcmV5IFJ5YW4nLFxuICAgICdUaW1vdGh5IE1jY295JyxcbiAgICAnU2FtdWVsIFdlbGNoJyxcbiAgICAnTGFycnkgRm9zdGVyJyxcbiAgICAnU3VzYW4gR2FyY2lhJyxcbiAgICAnU2FyYSBHYXJkbmVyJyxcbiAgICAnSm9obiBXYWxsYWNlJyxcbiAgICAnSmFuZSBCYW5rcycsXG4gICAgJ0JyZW5kYSBQYXluZScsXG4gICAgJ01hcnkgSGFycGVyJyxcbiAgICAnUGhpbGxpcCBIYXdraW5zJyxcbiAgICAnSnVzdGluIExhbmUnLFxuICAgICdMb3VpcyBNYXJ0aW4nLFxuICAgICdHZXJhbGQgTGFyc29uJyxcbiAgICAnUGhpbGxpcCBSdWl6JyxcbiAgICAnR3JlZ29yeSBSb2dlcnMnLFxuICAgICdBbmdlbGEgUml2ZXJhJyxcbiAgICAnQ2FybCBQYXluZScsXG4gICAgJ01hcmdhcmV0IEtpbScsXG4gICAgJ1dhbmRhIFJpY2hhcmRzJyxcbiAgICAnSm9obiBDcnV6JyxcbiAgICAnQ2hlcnlsIE11cnBoeScsXG4gICAgJ01lbGlzc2EgSm9yZGFuJyxcbiAgICAnUm9iZXJ0IFJheScsXG4gICAgJ0JlbmphbWluIFNpbXMnLFxuICAgICdKb2FuIFN1bGxpdmFuJyxcbiAgICAnV2F5bmUgV2VhdmVyJyxcbiAgICAnUmViZWNjYSBSZWlkJyxcbiAgICAnV2F5bmUgU2FuY2hleicsXG4gICAgJ0JhcmJhcmEgV2lsbGlhbXMnLFxuICAgICdMYXJyeSBLZWxseScsXG4gICAgJ0RvcmlzIEhlbnJ5JyxcbiAgICAnQW5kcmV3IEVsbGlzJyxcbiAgICAnQ2hyaXN0aW5hIE15ZXJzJyxcbiAgICAnRG9yb3RoeSBKb25lcycsXG4gICAgJ0thdGh5IEFsZXhhbmRlcicsXG4gICAgJ0FkYW0gQmVsbCcsXG4gICAgJ1JlYmVjY2EgTGF3c29uJyxcbiAgICAnV2lsbGllIENydXonLFxuICAgICdUaW5hIEdvcmRvbicsXG4gICAgJ0VhcmwgTWlsbHMnXG5dOyIsInZhciBQcmVkaWN0eVBpY2sgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBkYXRhID0gcmVxdWlyZSgnLi9kYXRhJyk7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpe1xuICAgIHZhciBwcmVkaWN0eVBpY2sgPSBuZXcgUHJlZGljdHlQaWNrKCk7XG4gICAgcHJlZGljdHlQaWNrLml0ZW1zKGRhdGEpO1xuXG4gICAgcHJlZGljdHlQaWNrLm9uKCdhY2NlcHQnLCBmdW5jdGlvbihhY2NlcHRlZFZhbHVlKSB7XG4gICAgICAgIGFsZXJ0KCdBY2NlcHRlZFZhbHVlOiAnICsgYWNjZXB0ZWRWYWx1ZSk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHByZWRpY3R5UGljay5yZW5kZXJlZEVsZW1lbnQpO1xufTsiLCJ2YXIgbm93ID0gcmVxdWlyZSgncGVyZm9ybWFuY2Utbm93JylcbiAgLCBnbG9iYWwgPSB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IHt9IDogd2luZG93XG4gICwgdmVuZG9ycyA9IFsnbW96JywgJ3dlYmtpdCddXG4gICwgc3VmZml4ID0gJ0FuaW1hdGlvbkZyYW1lJ1xuICAsIHJhZiA9IGdsb2JhbFsncmVxdWVzdCcgKyBzdWZmaXhdXG4gICwgY2FmID0gZ2xvYmFsWydjYW5jZWwnICsgc3VmZml4XSB8fCBnbG9iYWxbJ2NhbmNlbFJlcXVlc3QnICsgc3VmZml4XVxuXG5mb3IodmFyIGkgPSAwOyBpIDwgdmVuZG9ycy5sZW5ndGggJiYgIXJhZjsgaSsrKSB7XG4gIHJhZiA9IGdsb2JhbFt2ZW5kb3JzW2ldICsgJ1JlcXVlc3QnICsgc3VmZml4XVxuICBjYWYgPSBnbG9iYWxbdmVuZG9yc1tpXSArICdDYW5jZWwnICsgc3VmZml4XVxuICAgICAgfHwgZ2xvYmFsW3ZlbmRvcnNbaV0gKyAnQ2FuY2VsUmVxdWVzdCcgKyBzdWZmaXhdXG59XG5cbi8vIFNvbWUgdmVyc2lvbnMgb2YgRkYgaGF2ZSByQUYgYnV0IG5vdCBjQUZcbmlmKCFyYWYgfHwgIWNhZikge1xuICB2YXIgbGFzdCA9IDBcbiAgICAsIGlkID0gMFxuICAgICwgcXVldWUgPSBbXVxuICAgICwgZnJhbWVEdXJhdGlvbiA9IDEwMDAgLyA2MFxuXG4gIHJhZiA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgaWYocXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB2YXIgX25vdyA9IG5vdygpXG4gICAgICAgICwgbmV4dCA9IE1hdGgubWF4KDAsIGZyYW1lRHVyYXRpb24gLSAoX25vdyAtIGxhc3QpKVxuICAgICAgbGFzdCA9IG5leHQgKyBfbm93XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY3AgPSBxdWV1ZS5zbGljZSgwKVxuICAgICAgICAvLyBDbGVhciBxdWV1ZSBoZXJlIHRvIHByZXZlbnRcbiAgICAgICAgLy8gY2FsbGJhY2tzIGZyb20gYXBwZW5kaW5nIGxpc3RlbmVyc1xuICAgICAgICAvLyB0byB0aGUgY3VycmVudCBmcmFtZSdzIHF1ZXVlXG4gICAgICAgIHF1ZXVlLmxlbmd0aCA9IDBcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGNwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYoIWNwW2ldLmNhbmNlbGxlZCkge1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICBjcFtpXS5jYWxsYmFjayhsYXN0KVxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGUgfSwgMClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIE1hdGgucm91bmQobmV4dCkpXG4gICAgfVxuICAgIHF1ZXVlLnB1c2goe1xuICAgICAgaGFuZGxlOiArK2lkLFxuICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgY2FuY2VsbGVkOiBmYWxzZVxuICAgIH0pXG4gICAgcmV0dXJuIGlkXG4gIH1cblxuICBjYWYgPSBmdW5jdGlvbihoYW5kbGUpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKHF1ZXVlW2ldLmhhbmRsZSA9PT0gaGFuZGxlKSB7XG4gICAgICAgIHF1ZXVlW2ldLmNhbmNlbGxlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmbikge1xuICAvLyBXcmFwIGluIGEgbmV3IGZ1bmN0aW9uIHRvIHByZXZlbnRcbiAgLy8gYGNhbmNlbGAgcG90ZW50aWFsbHkgYmVpbmcgYXNzaWduZWRcbiAgLy8gdG8gdGhlIG5hdGl2ZSByQUYgZnVuY3Rpb25cbiAgcmV0dXJuIHJhZi5jYWxsKGdsb2JhbCwgZm4pXG59XG5tb2R1bGUuZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgY2FmLmFwcGx5KGdsb2JhbCwgYXJndW1lbnRzKVxufVxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjcuMVxuKGZ1bmN0aW9uKCkge1xuICB2YXIgZ2V0TmFub1NlY29uZHMsIGhydGltZSwgbG9hZFRpbWU7XG5cbiAgaWYgKCh0eXBlb2YgcGVyZm9ybWFuY2UgIT09IFwidW5kZWZpbmVkXCIgJiYgcGVyZm9ybWFuY2UgIT09IG51bGwpICYmIHBlcmZvcm1hbmNlLm5vdykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgfTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2VzcyAhPT0gbnVsbCkgJiYgcHJvY2Vzcy5ocnRpbWUpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIChnZXROYW5vU2Vjb25kcygpIC0gbG9hZFRpbWUpIC8gMWU2O1xuICAgIH07XG4gICAgaHJ0aW1lID0gcHJvY2Vzcy5ocnRpbWU7XG4gICAgZ2V0TmFub1NlY29uZHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBocjtcbiAgICAgIGhyID0gaHJ0aW1lKCk7XG4gICAgICByZXR1cm4gaHJbMF0gKiAxZTkgKyBoclsxXTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gZ2V0TmFub1NlY29uZHMoKTtcbiAgfSBlbHNlIGlmIChEYXRlLm5vdykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIGxvYWRUaW1lO1xuICAgIH07XG4gICAgbG9hZFRpbWUgPSBEYXRlLm5vdygpO1xuICB9IGVsc2Uge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsb2FkVGltZTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcbiIsInZhciByYWYgPSByZXF1aXJlKCdyYWYnKTtcblxuZnVuY3Rpb24gc2V0RWxlbWVudFNjcm9sbChlbGVtZW50LCB4LCB5KXtcbiAgICBpZihlbGVtZW50ID09PSB3aW5kb3cpe1xuICAgICAgICBlbGVtZW50LnNjcm9sbFRvKHgsIHkpO1xuICAgIH1lbHNle1xuICAgICAgICBlbGVtZW50LnNjcm9sbExlZnQgPSB4O1xuICAgICAgICBlbGVtZW50LnNjcm9sbFRvcCA9IHk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRUYXJnZXRTY3JvbGxMb2NhdGlvbih0YXJnZXQsIHBhcmVudCwgYWxpZ24pe1xuICAgIHZhciB0YXJnZXRQb3NpdGlvbiA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgcGFyZW50UG9zaXRpb24sXG4gICAgICAgIHgsXG4gICAgICAgIHksXG4gICAgICAgIGRpZmZlcmVuY2VYLFxuICAgICAgICBkaWZmZXJlbmNlWSxcbiAgICAgICAgbGVmdEFsaWduID0gYWxpZ24gJiYgYWxpZ24ubGVmdCAhPSBudWxsID8gYWxpZ24ubGVmdCA6IDAuNSxcbiAgICAgICAgdG9wQWxpZ24gPSBhbGlnbiAmJiBhbGlnbi50b3AgIT0gbnVsbCA/IGFsaWduLnRvcCA6IDAuNSxcbiAgICAgICAgbGVmdFNjYWxhciA9IGxlZnRBbGlnbixcbiAgICAgICAgdG9wU2NhbGFyID0gdG9wQWxpZ247XG5cbiAgICBpZihwYXJlbnQgPT09IHdpbmRvdyl7XG4gICAgICAgIHggPSB0YXJnZXRQb3NpdGlvbi5sZWZ0ICsgd2luZG93LnNjcm9sbFggLSB3aW5kb3cuaW5uZXJXaWR0aCAqIGxlZnRTY2FsYXIgKyBNYXRoLm1pbih0YXJnZXRQb3NpdGlvbi53aWR0aCwgd2luZG93LmlubmVyV2lkdGgpICogbGVmdFNjYWxhcjtcbiAgICAgICAgeSA9IHRhcmdldFBvc2l0aW9uLnRvcCArIHdpbmRvdy5zY3JvbGxZIC0gd2luZG93LmlubmVySGVpZ2h0ICogdG9wU2NhbGFyICsgTWF0aC5taW4odGFyZ2V0UG9zaXRpb24uaGVpZ2h0LCB3aW5kb3cuaW5uZXJIZWlnaHQpICogdG9wU2NhbGFyO1xuICAgICAgICB4ID0gTWF0aC5tYXgoTWF0aC5taW4oeCwgZG9jdW1lbnQuYm9keS5zY3JvbGxXaWR0aCAtIHdpbmRvdy5pbm5lcldpZHRoICogbGVmdFNjYWxhciksIDApO1xuICAgICAgICB5ID0gTWF0aC5tYXgoTWF0aC5taW4oeSwgZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQtIHdpbmRvdy5pbm5lckhlaWdodCAqIHRvcFNjYWxhciksIDApO1xuICAgICAgICBkaWZmZXJlbmNlWCA9IHggLSB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgZGlmZmVyZW5jZVkgPSB5IC0gd2luZG93LnNjcm9sbFk7XG4gICAgfWVsc2V7XG4gICAgICAgIHBhcmVudFBvc2l0aW9uID0gcGFyZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgb2Zmc2V0VG9wID0gdGFyZ2V0UG9zaXRpb24udG9wIC0gKHBhcmVudFBvc2l0aW9uLnRvcCAtIHBhcmVudC5zY3JvbGxUb3ApO1xuICAgICAgICB2YXIgb2Zmc2V0TGVmdCA9IHRhcmdldFBvc2l0aW9uLmxlZnQgLSAocGFyZW50UG9zaXRpb24ubGVmdCAtIHBhcmVudC5zY3JvbGxMZWZ0KTtcbiAgICAgICAgeCA9IG9mZnNldExlZnQgKyAodGFyZ2V0UG9zaXRpb24ud2lkdGggKiBsZWZ0U2NhbGFyKSAtIHBhcmVudC5jbGllbnRXaWR0aCAqIGxlZnRTY2FsYXI7XG4gICAgICAgIHkgPSBvZmZzZXRUb3AgKyAodGFyZ2V0UG9zaXRpb24uaGVpZ2h0ICogdG9wU2NhbGFyKSAtIHBhcmVudC5jbGllbnRIZWlnaHQgKiB0b3BTY2FsYXI7XG4gICAgICAgIHggPSBNYXRoLm1heChNYXRoLm1pbih4LCBwYXJlbnQuc2Nyb2xsV2lkdGggLSBwYXJlbnQuY2xpZW50V2lkdGgpLCAwKTtcbiAgICAgICAgeSA9IE1hdGgubWF4KE1hdGgubWluKHksIHBhcmVudC5zY3JvbGxIZWlnaHQgLSBwYXJlbnQuY2xpZW50SGVpZ2h0KSwgMCk7XG4gICAgICAgIGRpZmZlcmVuY2VYID0geCAtIHBhcmVudC5zY3JvbGxMZWZ0O1xuICAgICAgICBkaWZmZXJlbmNlWSA9IHkgLSBwYXJlbnQuc2Nyb2xsVG9wO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHgsXG4gICAgICAgIHk6IHksXG4gICAgICAgIGRpZmZlcmVuY2VYOiBkaWZmZXJlbmNlWCxcbiAgICAgICAgZGlmZmVyZW5jZVk6IGRpZmZlcmVuY2VZXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYW5pbWF0ZShwYXJlbnQpe1xuICAgIHJhZihmdW5jdGlvbigpe1xuICAgICAgICB2YXIgc2Nyb2xsU2V0dGluZ3MgPSBwYXJlbnQuX3Njcm9sbFNldHRpbmdzO1xuICAgICAgICBpZighc2Nyb2xsU2V0dGluZ3Mpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxvY2F0aW9uID0gZ2V0VGFyZ2V0U2Nyb2xsTG9jYXRpb24oc2Nyb2xsU2V0dGluZ3MudGFyZ2V0LCBwYXJlbnQsIHNjcm9sbFNldHRpbmdzLmFsaWduKSxcbiAgICAgICAgICAgIHRpbWUgPSBEYXRlLm5vdygpIC0gc2Nyb2xsU2V0dGluZ3Muc3RhcnRUaW1lLFxuICAgICAgICAgICAgdGltZVZhbHVlID0gTWF0aC5taW4oMSAvIHNjcm9sbFNldHRpbmdzLnRpbWUgKiB0aW1lLCAxKTtcblxuICAgICAgICBpZihcbiAgICAgICAgICAgIHRpbWUgPiBzY3JvbGxTZXR0aW5ncy50aW1lICsgMjAgfHxcbiAgICAgICAgICAgIChNYXRoLmFicyhsb2NhdGlvbi5kaWZmZXJlbmNlWSkgPD0gMSAmJiBNYXRoLmFicyhsb2NhdGlvbi5kaWZmZXJlbmNlWCkgPD0gMSlcbiAgICAgICAgKXtcbiAgICAgICAgICAgIHNldEVsZW1lbnRTY3JvbGwocGFyZW50LCBsb2NhdGlvbi54LCBsb2NhdGlvbi55KTtcbiAgICAgICAgICAgIHBhcmVudC5fc2Nyb2xsU2V0dGluZ3MgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHNjcm9sbFNldHRpbmdzLmVuZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZhbHVlWCA9IHRpbWVWYWx1ZSxcbiAgICAgICAgICAgIHZhbHVlWSA9IHRpbWVWYWx1ZTtcblxuICAgICAgICBzZXRFbGVtZW50U2Nyb2xsKHBhcmVudCxcbiAgICAgICAgICAgIGxvY2F0aW9uLnggLSBsb2NhdGlvbi5kaWZmZXJlbmNlWCAqIE1hdGgucG93KDEgLSB2YWx1ZVgsIHZhbHVlWCAvIDIpLFxuICAgICAgICAgICAgbG9jYXRpb24ueSAtIGxvY2F0aW9uLmRpZmZlcmVuY2VZICogTWF0aC5wb3coMSAtIHZhbHVlWSwgdmFsdWVZIC8gMilcbiAgICAgICAgKTtcblxuICAgICAgICBhbmltYXRlKHBhcmVudCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHRyYW5zaXRpb25TY3JvbGxUbyh0YXJnZXQsIHBhcmVudCwgc2V0dGluZ3MsIGNhbGxiYWNrKXtcbiAgICB2YXIgaWRsZSA9ICFwYXJlbnQuX3Njcm9sbFNldHRpbmdzO1xuXG4gICAgaWYocGFyZW50Ll9zY3JvbGxTZXR0aW5ncyl7XG4gICAgICAgIHBhcmVudC5fc2Nyb2xsU2V0dGluZ3MuZW5kKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5kKCl7XG4gICAgICAgIHBhcmVudC5fc2Nyb2xsU2V0dGluZ3MgPSBudWxsO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICBwYXJlbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGVuZCk7XG4gICAgfVxuXG4gICAgcGFyZW50Ll9zY3JvbGxTZXR0aW5ncyA9IHtcbiAgICAgICAgc3RhcnRUaW1lOiBEYXRlLm5vdygpLFxuICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgdGltZTogc2V0dGluZ3MudGltZSxcbiAgICAgICAgZWFzZTogc2V0dGluZ3MuZWFzZSxcbiAgICAgICAgYWxpZ246IHNldHRpbmdzLmFsaWduLFxuICAgICAgICBlbmQ6IGVuZFxuICAgIH07XG4gICAgcGFyZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBlbmQpO1xuXG4gICAgaWYoaWRsZSl7XG4gICAgICAgIGFuaW1hdGUocGFyZW50KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGFyZ2V0LCBzZXR0aW5ncywgY2FsbGJhY2spe1xuICAgIGlmKCF0YXJnZXQpe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIHNldHRpbmdzID09PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgY2FsbGJhY2sgPSBzZXR0aW5ncztcbiAgICAgICAgc2V0dGluZ3MgPSBudWxsO1xuICAgIH1cblxuICAgIGlmKCFzZXR0aW5ncyl7XG4gICAgICAgIHNldHRpbmdzID0ge307XG4gICAgfVxuXG4gICAgc2V0dGluZ3MudGltZSA9IHNldHRpbmdzLnRpbWUgfHwgMTAwMDtcbiAgICBzZXR0aW5ncy5lYXNlID0gc2V0dGluZ3MuZWFzZSB8fCBmdW5jdGlvbih2KXtyZXR1cm4gdjt9O1xuXG4gICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnRFbGVtZW50LFxuICAgICAgICBwYXJlbnRzID0gMDtcblxuICAgIGZ1bmN0aW9uIGRvbmUoKXtcbiAgICAgICAgcGFyZW50cy0tO1xuICAgICAgICBpZighcGFyZW50cyl7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgd2hpbGUocGFyZW50KXtcbiAgICAgICAgaWYoXG4gICAgICAgICAgICBzZXR0aW5ncy52YWxpZFRhcmdldCA/IHNldHRpbmdzLnZhbGlkVGFyZ2V0KHBhcmVudCwgcGFyZW50cykgOiB0cnVlICYmXG4gICAgICAgICAgICBwYXJlbnQgPT09IHdpbmRvdyB8fFxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIHBhcmVudC5zY3JvbGxIZWlnaHQgIT09IHBhcmVudC5jbGllbnRIZWlnaHQgfHxcbiAgICAgICAgICAgICAgICBwYXJlbnQuc2Nyb2xsV2lkdGggIT09IHBhcmVudC5jbGllbnRXaWR0aFxuICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpLm92ZXJmbG93ICE9PSAnaGlkZGVuJ1xuICAgICAgICApe1xuICAgICAgICAgICAgcGFyZW50cysrO1xuICAgICAgICAgICAgdHJhbnNpdGlvblNjcm9sbFRvKHRhcmdldCwgcGFyZW50LCBzZXR0aW5ncywgZG9uZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudDtcblxuICAgICAgICBpZighcGFyZW50KXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHBhcmVudC50YWdOYW1lID09PSAnQk9EWScpe1xuICAgICAgICAgICAgcGFyZW50ID0gd2luZG93O1xuICAgICAgICB9XG4gICAgfVxufTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiJdfQ==
