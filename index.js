var Predicty = require('predicty'),
    doc = require('doc-js'),
    crel = require('crel');

function renderPredictions(items, predictyPick){
    if(!predictyPick.predictionListElement) {
        return;
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
}

function PredictyPick(){
    Predicty.apply(this, arguments);

    var predictyPick = this;
    predictyPick.renderedElement = crel('div', {'class': 'predictyPick'});

    var docPredicty = doc(predictyPick.renderedElement);

    predictyPick.inputElement.addEventListener('focusin', function(){
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
        if (predictyPick.inputElement.value === '') {
            renderPredictions(predictyPick.items(), predictyPick);
        }
    });

    predictyPick.renderedElement.addEventListener('click', function() {
        // if (doc(event.target.parent) === predictyPick.predictionListElement) {
        //     return;
        // }
        docPredicty.removeClass('focus');
        predictyPick.clearPredictions();
        predictyPick.suggestionElement.innerText = '';

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
        if(event.which === 40) { //down

        }

        if(event.which === 38) { //up

        }

        var docPredictionListElement = doc.findOne(predictyPick.predictionListElement);
        var listLength = docPredictionListElement.children.length;

        doc(predictyPick.docPredictionListElement.children[predictyPick.currentSuggestionIndex]).removeClass('current');
        predictyPick.currentSuggestionIndex = (predictyPick.currentSuggestionIndex || 0) + 1;
        doc(predictyPick.docPredictionListElement.children[predictyPick.currentSuggestionIndex]).addClass('current');


        // docPredictionListElement
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

    renderPredictions(matchedItems, predictyPick);

    return matchedItems[0];
};

module.exports = PredictyPick;