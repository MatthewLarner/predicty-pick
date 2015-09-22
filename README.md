# predicty-pick
An auto-complete component  using https://www.npmjs.com/package/predicty with an suggestion picker

View a demo here:

https://cdn.rawgit.com/MatthewLarner/predicty-pick/master/tests/index.html

### Usage

```javascript
var PredictyPick = require('predicty-pick'),
	predictyPick = new PredictyPick();

// initialise with a list of items
predictyPick.items(['foo', 'bar', 'fizz', 'buzz']);

// call with the value to search against
predictPick.value('fo');
```

### Events

'value' Emitted whenever the value changes, passes value to the handler

'items' Emitted whenever the items change, passes items to the handler

'accept' Emitted whenever a suggestion is accepted, passes the suggestion to the handler
