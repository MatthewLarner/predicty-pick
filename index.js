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

    if(predictyPick.predictionListElement.children) {
        predictyPick.clearPredictions();
    }

    var fragment = document.createDocumentFragment();

    items.forEach(function(item) {
        var suggestionElement = crel('button',
            {
                'class': 'prediction',
                'style': 'pointer-events: all'
            },
            item
        );

        suggestionElement.addEventListener('click', function() {
            predictyPick._suggestion = item;
            predictyPick._acceptPrediction();
        });

        fragment.appendChild(suggestionElement);
    });


    predictyPick.predictionListElement.appendChild(fragment);
    updateCurrentSelection(predictyPick);
}

function PredictyPick(){
    Predicty.apply(this, arguments);

    var predictyPick = this;
    predictyPick.open = false;
    predictyPick.renderedElement = crel('div', {'class': 'predictyPick'});

    var docPredicty = doc(predictyPick.renderedElement);


    predictyPick.inputElement.addEventListener('focusin', function(){
        predictyPick.open = true;
        docPredicty.addClass('focus');

        if(predictyPick.inputElement.value) {
            predictyPick.value(predictyPick.inputElement.value);
            predictyPick._update();

            var valueLength = predictyPick.inputElement.value.length;
            predictyPick.inputElement.setSelectionRange(valueLength, valueLength);
            predictyPick._match(predictyPick.inputElement.value);
        } else {
            renderPredictions(predictyPick.items(), predictyPick);
        }
    });

    predictyPick.inputElement.addEventListener('keyup', function() {
        if (predictyPick.inputElement.value === '' && predictyPick.open) {
            renderPredictions(predictyPick.items(), predictyPick);
        }
    });

    predictyPick.renderedElement.addEventListener('click', function() {
        predictyPick.open = false;
        docPredicty.removeClass('focus');
        predictyPick.clearPredictions();
        predictyPick.suggestionElement.innerText = '';
        predictyPick.inputElement.blur();
    });

    predictyPick.renderedElement.appendChild(predictyPick.element);

    var predictionListElement = crel('div', {'class': 'predictionList'});
    predictyPick.predictionListElement = predictionListElement;
    predictyPick.renderedElement.appendChild(predictionListElement);

    predictyPick.on('accept', function(){
        // predictyPick.inputElement.blur();
        // docPredicty.removeClass('focus');
        // predictyPick.clearPredictions();
    });

    predictyPick.renderedElement.addEventListener('keydown', function(event) {
        if(!predictyPick.open) {
            return;
        }

        if(event.which === 13) { //enter
            predictyPick._acceptPrediction();
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

        predictyPick.currentSuggestionIndex = currentSuggestionIndex;

        var currentValue = predictyPick.value();

        var items = predictyPick.matchedItems.length ? predictyPick.matchedItems : predictyPick.items();

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