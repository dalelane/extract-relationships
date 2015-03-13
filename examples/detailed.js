var util = require('util');
var watson = require('extract-relationships');

var text = 'John Smith works for IBM. ' + 
           'He started in 2004. ' + 
           'John lives in the UK, in a town called Winchester. ' + 
           'John used to go to University in Bath.';

var options = {
    includeMentions      : true, 
    includeRelationships : true, 
    includeLocations     : true,
    includeScores        : true, 
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
       score: 0.887372,
       mentions:
        [ { mtype: 'NAM',
            role: 'PERSON',
            class: 'SPC',
            text: 'John Smith',
            scores: { score: 0.995296, coref: 1 },
            location: { begin: 0, end: 9, 'head-begin': 0, 'head-end': 9 } },
          { mtype: 'NAM',
            role: 'PERSON',
            class: 'SPC',
            text: 'John',
            scores: { score: 0.999208, coref: 0.990678 },
            location: { begin: 46, end: 49, 'head-begin': 46, 'head-end': 49 } },
          { mtype: 'NAM',
            role: 'PERSON',
            class: 'SPC',
            text: 'John',
            scores: { score: 0.999518, coref: 0.996437 },
            location: { begin: 97, end: 100, 'head-begin': 97, 'head-end': 100 } },
          { mtype: 'PRO',
            role: 'PERSON',
            class: 'SPC',
            text: 'He',
            scores: { score: 0.996168, coref: 0.628118 },
            location: { begin: 26, end: 27, 'head-begin': 26, 'head-end': 27 } } ] },
     { type: 'ORGANIZATION',
       class: 'SPC',
       level: 'NAM',
       subtype: 'COMMERCIAL',
       score: 1,
       mentions:
        [ { mtype: 'NAM',
            role: 'ORGANIZATION',
            class: 'SPC',
            text: 'IBM',
            scores: { score: 0.973326, coref: 1 },
            location: { begin: 21, end: 23, 'head-begin': 21, 'head-end': 23 } } ] },
     { type: 'GPE',
       class: 'SPC',
       level: 'NAM',
       subtype: 'AREA',
       score: 1,
       mentions:
        [ { mtype: 'NAM',
            role: 'LOCATION',
            class: 'SPC',
            text: 'UK',
            scores: { score: 0.555308, coref: 1 },
            location: { begin: 64, end: 65, 'head-begin': 64, 'head-end': 65 } } ] },
     { type: 'GPE',
       class: 'SPC',
       level: 'NAM',
       score: 0.937198,
       mentions:
        [ { mtype: 'NAM',
            role: 'LOCATION',
            class: 'SPC',
            text: 'Winchester',
            scores: { score: 0.380848, coref: 1 },
            location: { begin: 85, end: 94, 'head-begin': 85, 'head-end': 94 } },
          { mtype: 'NOM',
            role: 'LOCATION',
            class: 'SPC',
            text: 'town',
            scores: { score: 0.941741, coref: 0.87834 },
            location: { begin: 73, end: 76, 'head-begin': 73, 'head-end': 76 } } ] },
     { type: 'ORGANIZATION',
       class: 'SPC',
       level: 'NAM',
       subtype: 'EDUCATIONAL',
       score: 1,
       mentions:
        [ { mtype: 'NAM',
            role: 'ORGANIZATION',
            class: 'SPC',
            text: 'University',
            scores: { score: 0.38299, coref: 1 },
            location: { begin: 116, end: 125, 'head-begin': 116, 'head-end': 125 } } ] },
     { type: 'GPE',
       class: 'SPC',
       level: 'NAM',
       score: 0.297996,
       mentions:
        [ { mtype: 'NAM',
            role: 'LOCATION',
            class: 'SPC',
            text: 'Bath',
            scores: { score: 0.988661, coref: 0.297996 },
            location: { begin: 130, end: 133, 'head-begin': 130, 'head-end': 133 } } ] },
     { type: 'DATE',
       class: 'SPC',
       level: 'NONE',
       score: 1,
       mentions:
        [ { mtype: 'NONE',
            role: 'DATE',
            class: 'SPC',
            text: '2004',
            scores: { score: 0.828233, coref: 1 },
            location: { begin: 40, end: 43, 'head-begin': 40, 'head-end': 43 } } ] } ],
  relationships:
   [ { type: 'employedBy',
       entities:
        { one: { type: 'PERSON', class: 'SPC', level: 'NAM' },
          two:
           { type: 'ORGANIZATION',
             class: 'SPC',
             level: 'NAM',
             subtype: 'COMMERCIAL' } },
       mentions:
        [ { score: 0.906314,
            class: 'SPECIFIC',
            modality: 'ASSERTED',
            tense: 'UNSPECIFIED',
            one:
             { mtype: 'NAM',
               etype: 'PERSON',
               role: 'PERSON',
               class: 'SPC',
               text: 'John Smith',
               location: { begin: 0, end: 9, 'head-begin': 0, 'head-end': 9 } },
            two:
             { mtype: 'NAM',
               etype: 'ORGANIZATION',
               role: 'ORGANIZATION',
               class: 'SPC',
               text: 'IBM',
               location: { begin: 21, end: 23, 'head-begin': 21, 'head-end': 23 } } } ] },
     { type: 'locatedAt',
       entities:
        { one: { type: 'PERSON', class: 'SPC', level: 'NAM' },
          two: { type: 'GPE', class: 'SPC', level: 'NAM', subtype: 'AREA' } },
       mentions:
        [ { score: 0.585468,
            class: 'SPECIFIC',
            modality: 'ASSERTED',
            tense: 'UNSPECIFIED',
            one:
             { mtype: 'NAM',
               etype: 'PERSON',
               role: 'PERSON',
               class: 'SPC',
               text: 'John',
               location: { begin: 46, end: 49, 'head-begin': 46, 'head-end': 49 } },
            two:
             { mtype: 'NAM',
               etype: 'GPE',
               role: 'LOCATION',
               class: 'SPC',
               text: 'UK',
               location: { begin: 64, end: 65, 'head-begin': 64, 'head-end': 65 } } } ] },
     { type: 'locatedAt',
       entities:
        { one: { type: 'PERSON', class: 'SPC', level: 'NAM' },
          two: { type: 'GPE', class: 'SPC', level: 'NAM' } },
       mentions:
        [ { score: 0.389106,
            class: 'SPECIFIC',
            modality: 'ASSERTED',
            tense: 'UNSPECIFIED',
            one:
             { mtype: 'NAM',
               etype: 'PERSON',
               role: 'PERSON',
               class: 'SPC',
               text: 'John',
               location: { begin: 46, end: 49, 'head-begin': 46, 'head-end': 49 } },
            two:
             { mtype: 'NOM',
               etype: 'GPE',
               role: 'LOCATION',
               class: 'SPC',
               text: 'town',
               location: { begin: 73, end: 76, 'head-begin': 73, 'head-end': 76 } } } ] },
     { type: 'educatedAt',
       entities:
        { one: { type: 'PERSON', class: 'SPC', level: 'NAM' },
          two:
           { type: 'ORGANIZATION',
             class: 'SPC',
             level: 'NAM',
             subtype: 'EDUCATIONAL' } },
       mentions:
        [ { score: 0.867989,
            class: 'SPECIFIC',
            modality: 'ASSERTED',
            tense: 'UNSPECIFIED',
            one:
             { mtype: 'NAM',
               etype: 'PERSON',
               role: 'PERSON',
               class: 'SPC',
               text: 'John',
               location: { begin: 97, end: 100, 'head-begin': 97, 'head-end': 100 } },
            two:
             { mtype: 'NAM',
               etype: 'ORGANIZATION',
               role: 'ORGANIZATION',
               class: 'SPC',
               text: 'University',
               location: { begin: 116, end: 125, 'head-begin': 116, 'head-end': 125 } } } ] },
     { type: 'basedIn',
       entities:
        { one:
           { type: 'ORGANIZATION',
             class: 'SPC',
             level: 'NAM',
             subtype: 'EDUCATIONAL' },
          two: { type: 'GPE', class: 'SPC', level: 'NAM' } },
       mentions:
        [ { score: 0.720848,
            class: 'SPECIFIC',
            modality: 'ASSERTED',
            tense: 'UNSPECIFIED',
            one:
             { mtype: 'NAM',
               etype: 'ORGANIZATION',
               role: 'ORGANIZATION',
               class: 'SPC',
               text: 'University',
               location: { begin: 116, end: 125, 'head-begin': 116, 'head-end': 125 } },
            two:
             { mtype: 'NAM',
               etype: 'GPE',
               role: 'LOCATION',
               class: 'SPC',
               text: 'Bath',
               location: { begin: 130, end: 133, 'head-begin': 130, 'head-end': 133 } } } ] } ] }

 *
 */
