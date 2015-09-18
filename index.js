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
