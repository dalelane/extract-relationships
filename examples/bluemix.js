var util = require('util');
var extractrel = require('extract-relationships');

var text = 'John Smith works for IBM. ' + 
           'He started in 2004. ' + 
           'John lives in the UK, in a town called Winchester. ' + 
           'John used to go to University in Bath.';

extractrel.extract(text, function(err, entities){
    if (err){
        return console.error(err);
    }

    console.log(util.inspect(entities, { showHidden : false, depth : null }));
});
