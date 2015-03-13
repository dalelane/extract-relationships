var util = require('util');
var watson = require('extract-relationships');

var text = 'John Smith works for IBM. ' + 
           'He started in 2004. ' + 
           'John lives in the UK, in a town called Winchester. ' + 
           'John used to go to University in Bath.';

var options = {
    includeMentions      : true, 
    includeRelationships : false, 
    includeLocations     : false,
    includeScores        : false, 
    includeIds           : false,

    api : { 
        url : process.env.BLUEMIX_WATSON_RELEXT_URL,
        user : process.env.BLUEMIX_WATSON_RELEXT_USER,
        pass : process.env.BLUEMIX_WATSON_RELEXT_PASS
    }
};

watson.extract(text, options, function(err, entities){
    if (err){
        return console.error(err);
    }

    console.log(util.inspect(entities, { showHidden : false, depth : null }));
});


/*
 * EXPECTED OUTPUT
 * ---------------

{ entities:
   [ { type: 'PERSON',
       class: 'SPC',
       level: 'NAM',
       mentions:
        [ { mtype: 'NAM', role: 'PERSON', class: 'SPC', text: 'John Smith' },
          { mtype: 'NAM', role: 'PERSON', class: 'SPC', text: 'John' },
          { mtype: 'NAM', role: 'PERSON', class: 'SPC', text: 'John' },
          { mtype: 'PRO', role: 'PERSON', class: 'SPC', text: 'He' } ] },
     { type: 'ORGANIZATION',
       class: 'SPC',
       level: 'NAM',
       subtype: 'COMMERCIAL',
       mentions: [ { mtype: 'NAM', role: 'ORGANIZATION', class: 'SPC', text: 'IBM' } ] },
     { type: 'GPE',
       class: 'SPC',
       level: 'NAM',
       subtype: 'AREA',
       mentions: [ { mtype: 'NAM', role: 'LOCATION', class: 'SPC', text: 'UK' } ] },
     { type: 'GPE',
       class: 'SPC',
       level: 'NAM',
       mentions:
        [ { mtype: 'NAM',
            role: 'LOCATION',
            class: 'SPC',
            text: 'Winchester' },
          { mtype: 'NOM', role: 'LOCATION', class: 'SPC', text: 'town' } ] },
     { type: 'ORGANIZATION',
       class: 'SPC',
       level: 'NAM',
       subtype: 'EDUCATIONAL',
       mentions:
        [ { mtype: 'NAM',
            role: 'ORGANIZATION',
            class: 'SPC',
            text: 'University' } ] },
     { type: 'GPE',
       class: 'SPC',
       level: 'NAM',
       mentions: [ { mtype: 'NAM', role: 'LOCATION', class: 'SPC', text: 'Bath' } ] },
     { type: 'DATE',
       class: 'SPC',
       level: 'NONE',
       mentions: [ { mtype: 'NONE', role: 'DATE', class: 'SPC', text: '2004' } ] } ] }

 *
 */
