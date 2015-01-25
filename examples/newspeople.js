/**
 * Downloads the contents of a news story, then use the 
 *   Watson Relationship Extraction service to identify
 *   the names of all the people mentioned in the story.
 *
 * @author Dale Lane
 */

var async = require('async');
var unfluff = require('unfluff');
var request = require('request');

// this is the module we are demonstrating
var watson = require('extract-relationships');

// this is the story we are going to look for names in
var bbcNewsStoryUrl = 'http://www.bbc.co.uk/news/magazine-30934629';


// you can just hard-code your username and password from Bluemix
//  into your source code, but you really shouldn't
var bluemixoptions = {
    api : {
        url : process.env.BLUEMIX_WATSON_RELEXT_URL,
        user : process.env.BLUEMIX_WATSON_RELEXT_USER,
        pass : process.env.BLUEMIX_WATSON_RELEXT_PASS
    }
};


async.waterfall([
    // 
    // download the contents of a BBC news story
    function (callback) {
        request(bbcNewsStoryUrl, callback); 
    }, 

    //
    // get the text contents out of the story
    function (response, body, callback) {
        var contents = unfluff(body).text;

        callback(null, contents);
    }, 

    //
    // submit the story text to the Relationship Extraction service
    function (text, callback) {
        watson.extract(text, bluemixoptions, callback);
    },

    //
    // get the names of people from the response
    function (storyinfo, callback) {
        // filter the responses to pick out the people entities
        var people = storyinfo.entities.filter(function (entity) {            
            return entity.type === 'PERSON' && 
                   entity.level === 'NAM' && 
                   // add a threshold so we ignore entities 
                   //  with a very low confidence score
                   entity.score >= 0.5;
        });

        // get the names out of those responses
        var names = people.map(function (person) {

            var personnames = [];

            // Look through each mention of this person
            //   as some of the mentions could refer to their occupation or job title
            //   and some of the mentions will be 'he', 'she', 'they', etc.
            // We're just interested in the names
            person.mentions.forEach(function (mention) {
                if (mention.role === 'PERSON' && mention.mtype === 'NAM') {
                    personnames.push(mention.text);
                }
            });

            return personnames;
        });

        callback(null, names);
    }
], function(err, result){
    // print out the names we found
    console.log(result);
});


/*
 * EXPECTED OUTPUT
 * ===============

[ [ 'Winston Churchill',
    'Winston Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Churchill',
    'Winston Churchill' ],
  [ 'John Maynard Keynes' ],
  [ 'Nigel Knight' ],
  [ 'Hitler', 'Hitler', 'Hitler', 'Hitler' ],
  [ 'Boris Johnson' ],
  [ 'Darwin' ],
  [ 'Neville Chamberlain',
    'Chamberlain',
    'Chamberlain',
    'Chamberlain',
    'Chamberlain' ],
  [ 'Arthur Bryant', 'Bryant' ],
  [ 'Elizabeth I' ] ]


 */