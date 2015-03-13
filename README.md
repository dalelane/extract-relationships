# extract-relationships

## What is this for?

Identifying things mentioned in unstructured text. 

You provide text, and it'll extract: 

 - the entities mentioned in that text
 - the different mentions of each entity
 - the relationships between the entities contained in the text

## Contents
- [How this works](#how-this-works)
- [Usage](#usage)
    - [Install](#install)
    - [Basic](#basic)
    - [Demo](#demo)
- [Options](#options)
- [Interpreting the output](#interpreting-the-output)
- [Authentication](#authentication)
    - [Bluemix](#bluemix)
    - [Running outside Bluemix](#running-outside-bluemix)
- [Usage and trademarks](#usage-and-trademarks)


## How this works

This package is a thin library around the [IBM Watson Relationship Extraction](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/relationship-extraction.html) service on [IBM Bluemix](http://bluemix.net/). All the natural language processing stuff is happening in that hosted service. This package just formats the request for you, and parses and cleans up the response to make it easier to consume in a node.js / Javascript application. 

There is nothing here that you couldn't get by driving those APIs yourself, but hopefully using this thin wrapper will be quicker and easier. 

This means:
- You **don't** need to run your application on Bluemix - the APIs are accessible over the web
- You **do** need an Internet connection - this package sends HTTP requests to an API hosted on IBM's Bluemix platform. It is not doing the NLP locally. 
- You **do** need to sign up for an account with Bluemix first - the API it's using is authenticated, but this is quick and relatively painless

## Usage

### Install
```
npm install extract-relationships --save
```

### Basic 
Using default options 
[examples/bluemix.js](https://github.com/dalelane/extract-relationships/tree/master/examples/bluemix.js)
```
var watson = require('extract-relationships');
watson.extract(yourtext, function (err, response) {
    if (err) {
        return console.error(err);
    }

    // output is contained in response
});
```

Using custom options
[examples/detailed.js](https://github.com/dalelane/extract-relationships/tree/master/examples/detailed.js)
```
var watson = require('extract-relationships');
watson.extract(yourtext, options, function (err, response) {
    if (err) {
        return console.error(err);
    }

    // output is contained in response
});
```

### Demo
Grab the contents of a news story, and use the Watson Relationship Extraction service to pick out the names of the people mentioned in that news story.

Full working source in [examples/newspeople.js](https://github.com/dalelane/extract-relationships/tree/master/examples/newspeople.js)

Snippet here:
```
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
```

## Options
```
{
    // If true, entities found in the text are returned, with the 
    //   mentions of each entity.
    // Defaults to true if not provided.
    includeMentions : true, 

    // If true, relationships found between entities in the text
    //   are returned, with the mention of each relationship.
    // Defaults to false if not provided.
    includeRelationships : false, 

    // If true, the locations of items found in the text are 
    //   returned, as offsets into the input text.
    // Defaults to false if not provided
    includeLocations : false,

    // If true, the confidence scores in each item returned by the
    //   API are included in the response (as doubles between 
    //   0.0 and 1.0). 
    // Defaults to true if not provided
    includeScores : true,

    // if true, unique IDs will be included with objects returned
    //  in the response
    includeIds : false,



    // Language & corpus profile to use to process text
    //   'ie-en-news' is based on English news sources
    //   'ie-es-news' is based on Spanish news sources
    // see http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/apis/#!/relationship-extraction/extract
    // Defaults to 'ie-en-news'
    dataset : 'ie-en-news', 


    // URL to send requests to, and the username and password
    //  This is not required if running in Bluemix
    //  see 'Authentication' below
    api : {
        url : 'https://...',
        user : 'your-relationship-extraction-username',
        pass : 'your-relationship-extraction-password'
    }
}
```

## Interpreting the output

The official documentation can be found in the [Watson Developer Cloud Documentation](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/sireapi) and is the definitive guide to the meaning of the values returned by the API. 

An example of what the output looks like can be found [here](https://gist.github.com/dalelane/223500f2eae708fe34ef) and in the comments in each of the [examples](https://github.com/dalelane/extract-relationships/tree/master/examples). 

The structure of the output returned by this client library is outlined here:

```
{
    //
    // a list of the entities found 
    //

    entities : [
        // see http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/sireapi/#outputEntities
        //  for the meaning of these values
        {
            // type of the entity
            //   see http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/sireapi/#outputEntityTypes 
            type : 'ORGANIZATION',
            subtype : 'EDUCATIONAL',

            // class of the entity
            //  SPC means a reference to a specific thing
            //  NEG means a negated reference to a specific thing
            //  GEN means a generic reference, such as a metaphorical reference
            class : 'SPC',

            // level of the entity
            //  e.g. NAM for a named entity as a proper name, PRO for pronoun, etc.
            level : 'NAM', 

            // confidence level in the accuracy of this entity annotation
            score : 0.9819,

            // a list of each of the mentions of this entity
            mentions : [
                // see http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/sireapi/#outputMentions
                //  for the meaning of these values
                {
                    // type and class of the mention
                    mtype : 'NAM', 
                    class : 'SPC',

                    // context-sensitive role of the entity within this mention
                    role : 'ORGANIZATION',

                    // the covered text for this mention
                    text : 'University', 

                    // location of the mention in the provided text
                    location : {
                        // character offsets for the start and end of the mention text
                        begin : 123, end : 133, 

                        // character offsets for the head word of a phrase in the mention
                        head-begin : 123, head-end : 133
                    },

                    scores : {
                        // confidence level for the accuracy of this mention
                        score : 0.8271,
                        // confidence level for the accuracy that this refers
                        //  to the other mentions 
                        coref : 0.9912
                    }
                }
            ]
        }
    ],


    //
    // a list of the relationships found between entities
    //

    relationships : [
        // see http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/sireapi/#outputRelations
        //  for the meaning of these values
        {
            // type of the relationship
            //  see http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/sireapi/#outputRelationTypes
            //   for the list of possible types
            type : 'educatedAt', 

            // the two entities that this is a relationship between
            entities : {
                // the entity that this is a relationship from
                one : { 
                    type : 'PERSON', 
                    class : 'SPC', 
                    level : 'NAM'
                },

                // the entity that this is a relationship to
                two : {
                    type : 'ORGANIZATION', 
                    subtype : 'EDUCATIONAL', 
                    class : 'SPC', 
                    level : 'NAM'
                }
            },

            // the instances of this relationship found in the text
            //  see http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/sireapi/#outputRelations
            //  for the meaning of these values
            mentions : [
                // each instance of the relationship
                {
                    // specificity of the relation mention 
                    //  e.g. SPECIFIC, NEG etc.
                    class : 'SPECIFIC', 

                    // nature of the relation mention
                    modality : 'ASSERTED', 

                    // time of the relation mention relative to the publication of the text
                    //  e.g. PAST, PRESENT, FUTURE
                    tense : 'UNSPECIFIED', 

                    // confidence level for the accuracy of the relation
                    score : 0.7231, 

                    // the mention of the entity that this is a relationship from
                    one : {
                        // type and class of the mention
                        mtype : 'NAM', 
                        class : 'SPC',

                        // type of the entity 
                        etype : 'PERSON', 

                        // context-sensitive role of the entity within this mention
                        role : 'PERSON',

                        // the covered text for this mention
                        text : 'John Smith', 

                        // location of the mention in the provided text
                        location : {
                            // character offsets for the start and end of the mention text
                            begin : 223, end : 233, 

                            // character offsets for the head word of a phrase in the mention
                            head-begin : 223, head-end : 233
                        }
                    },

                    // the mention of the entity that this is a relationship from
                    two : {
                        // type and class of the mention
                        mtype : 'NAM', 
                        class : 'SPC',

                        // type of the entity 
                        etype : 'ORGANIZATION', 

                        // context-sensitive role of the entity within this mention
                        role : 'ORGANIZATION',

                        // the covered text for this mention
                        text : 'University', 

                        // location of the mention in the provided text
                        location : {
                            // character offsets for the start and end of the mention text
                            begin : 123, end : 133, 

                            // character offsets for the head word of a phrase in the mention
                            head-begin : 123, head-end : 133
                        }
                    }
                }
            ]
        }
    ]
}
```

## Authentication

The package submits HTTP requests to an API which requires a username and password. 

### Bluemix 

If you are running your code on the Bluemix platform:

 1. Add the "Watson Relationship Extraction" service and bind it to your app
 2. That's it - the client library will pick up the credentials needed for the API from the Bluemix environment

### Running outside Bluemix

If you are running your code anywhere else, outside of Bluemix, you'll first need to provision yourself a Relationship Extraction service. 

There is a [more detailed walkthrough on the blog post](http://dalelane.co.uk/blog/?p=3272) about this, but in short:

 1. Go to [bluemix.net](http://bluemix.net)
 2. Sign in with your IBM ID (creating one if you've not already got one)
 3. Go to the Bluemix Dashboard
 4. Create an app
 5. Create a web app
 6. Choose SDK for Node.js
 7. Give it a name 
 8. 'Add a service' and choose "Watson Relationship Extraction"
 9. From the App view, click on the 'Show Credentials' link for the bound Relationship Extraction service
 10. Copy the 'url', 'username' and 'password' values shown

Command-line equivalents of these steps can be found in the [Watson Developer Cloud documentation](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/getting_started/#usage-1). 

Once created, you can get the url, username and password using:
```
cf env <application-name>
```

## Usage and trademarks

Bluemix and Watson come from, and are trademarks of, IBM. This client library is not provided or supported by IBM. It aims to make it easier to use a Bluemix API, but makes no claims over what you can or cannot do with that API. It is your responsibility to conform to any terms and conditions for usage of the API that are part of signing up for an account on Bluemix.
