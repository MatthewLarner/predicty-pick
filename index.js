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
        docPredicty.removeClass('focus');
        predictyPick.clearPredictions();
        predictyPick.suggestionElement.innerText = '';

    });

    predictyPick.renderedElement.appendChild(predictyPick.element);

    var predictionListElement = crel('div', {'class': 'predictionList'});
    predictyPick.predictionListElement = predictionListElement;
    predictyPick.renderedElement.appendChild(predictionListElement);

    predictyPick.on('accept', function(){
        predictyPick.inputElement.blur();
        predictyPick.clearPredictions();
        docPredicty.removeClass('focus');
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