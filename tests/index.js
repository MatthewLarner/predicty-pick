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