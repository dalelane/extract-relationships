'use strict';

/**
 * A client library for the Watson Relationship Extraction service 
 * on IBM Bluemix. It's a thin wrapper around the API hosted on 
 * Bluemix. 
 * 
 * For more information about usage and authentication requirements
 * please see github.com/dalelane/extract-relationships
 * 
 * @module extract-relationships
 * @author Dale Lane (email@dalelane.co.uk)
 */

// core dependencies
var util = require('util');

// external dependencies
var request = require('request');
var httpstatus = require('http-status');
var xml2object = require('xml2object');
var clone = require('clone');


/**
 * getAsArray()
 * 
 *  Returns the object provided in an array. 
 *   If it is already an array, it is returned as-is. 
 *   Otherwise, a new array is created, with it as the single member. 
 * 
 *  This is because the Bluemix API will return arrays as individual 
 *   objects if there is only one item in the array. Wrapping all 
 *   responses in this means we don't need to worry about checking, 
 *   and can treat all responses in the same way.
 */
function getAsArray(obj) {
    if (obj) {
        if (util.isArray(obj)) {
            // multiple objects in API response
            return obj;
        }
        else {
            // one object in API response
            return [ obj ];
        }
    }
    else {
        // no objects in API response
        return [];
    }
}

/**
 * cleanId()
 *
 *   IDs are returned from the Bluemix service prefixed with '-'
 *    so we remove that to make it a little cleaner.
 */
function cleanId(bluemixid) {
    if (bluemixid && bluemixid.substr(0, 1) === '-'){
        return bluemixid.substr(1);
    }
    return bluemixid;
}

/**
 * collectEntityMentions()
 * 
 *   Takes a collection of entity objects, and a collection of mentions of 
 *    those entities, as two separate lists. 
 * 
 *   This combines them into a single list, with the mentions together with
 *    the entities that they are a mention of. 
 * 
 * @param {Object} entities - object containing descriptions of entities, 
 *                    each with a list of IDs of the mentions of that entity
 *                  for example:
 *                     { E1 : { type : 'PERSON', mentref : [ { mid : M1 }, { mid : M2 } ] }, 
 *                       E2 : { text : 'GPE', mentref : { mid : M3 } },
 *                       E3 : { text : 'ORGANIZATION', mentref : [ { mid : M4 }, { mid : M5 }, { mid : M6 } ] } }
 * @param {Object} mentions - object containing descriptions of entity mentions
 *                  for example:
 *                     { M1 : { text : 'John' },
 *                       M2 : { text : 'John Smith' }, 
 *                       M3 : { text : 'England' },
 *                       M4 : { text : 'IBM' }, 
 *                       M5 : { text : 'Big Blue' }, 
 *                       M6 : { text : 'International Business Machines' } }
 *
 * @returns {Array} of consolidated entities with their mentions
 *                  for example:
 *                     [ { type : 'PERSON', mentions : [ { text : 'John' }, { text : 'John Smith' } ] },
 *                       { type : 'GPE', mentions : [ { text : 'England' } ] }, 
 *                       { type : 'ORGANIZATION', mentions : [ { text : 'IBM' }, { text : 'Big Blue' }, 
 *                                                         { text : 'International Business Machines' } ] } ]
 */
function collectEntityMentions(entities, mentions) {

    var entityIds = Object.keys(entities);
    return entityIds.map(function (entityid) {
        // for each entity in the provided object...
        var entity = entities[entityid];

        // prepare a list of the mentions of the entity
        //   (there will always be at least one - you can't
        //   find an entity in the input text if there are no
        //   mentions of it in the text!)
        entity.mentions = [];

        // the entity will contain a list of references of it's 
        //  mentions in 'mentref'
        // we replace this with the actual mentions 
        getAsArray(entity.mentref).forEach(function (mention) {
            var mentioninfo = clone(mentions[mention.mid]);

            // as entities and mentions are now together, it is 
            //  unnecessary for each mention to include the type
            //  of it's parent entity as this info is already in the 
            //  entity
            delete mentioninfo.etype;

            // add the mention to the list of mentions
            entity.mentions.push(mentioninfo);
        });

        // remove the list of mention IDs
        delete entity.mentref;

        return entity;
    });
}


/**
 * collectRelationshipMentions()
 * 
 *   Takes a collection of entity objects, a collection of mentions of 
 *    those entities, and a list of relationships found between 
 *    mentions of entities - as three separate lists. 
 * 
 *   This combines them into a single list, with the relationships 
 *    together with the entities and mentions that they are a relationship
 *    between. 
 * 
 * @param {Object} options - client options specifying what to include in output
 * @param {Object} entities - object containing descriptions of entities, 
 *                    each with a list of IDs of the mentions of that entity
 *                  for example:
 *                     { E1 : { type : 'PERSON', mentref : [ { mid : M1 }, { mid : M2 } ] }, 
 *                       E2 : { text : 'GPE', mentref : { mid : M3 } },
 *                       E3 : { text : 'ORGANIZATION', mentref : [ { mid : M4 }, { mid : M5 }, { mid : M6 } ] } }
 * @param {Object} mentions - object containing descriptions of entity mentions
 *                  for example:
 *                     { M1 : { text : 'John' },
 *                       M2 : { text : 'John Smith' }, 
 *                       M3 : { text : 'England' },
 *                       M4 : { text : 'IBM' }, 
 *                       M5 : { text : 'Big Blue' }, 
 *                       M6 : { text : 'International Business Machines' } }
 * @param {Array} relationships - array of relationship definitions
 *                  for example:
 *                     [ { type : 'employedBy', 
 *                         rel_entity_arg : [ { eid : 'E1' }, { eid : 'E3' } ], 
 *                         rel_mentions : [ { relmention : { rel_mention_arg : [ { mid : M2 }, { mid : M5 } ] } },  
 *                                          { relmention : { rel_mention_arg : [ { mid : M1 }, { mid : M6 } ] } } ] }, 
 *                       { type : 'basedIn', 
 *                         rel_entity_arg : [ { eid : 'E3' }, { eid : 'E2' } ], 
 *                         rel_mentions : { relmention : { rel_mention_arg : [ { mid : M4 }, { mid : M3 } ] } } } ]
 *
 * @returns {Array} of consolidated relationships, with the entities they are relationships between
 *                  for example:
 *                     [ { type : 'employedBy', 
 *                         entities : { one : { type : 'PERSON' },    two : { type : 'ORGANIZATION' } }, 
 *                         mentions : [ { one : { text : 'John Smith' }, two : { text : 'Big Blue' } }, 
 *                                      { one : { text : 'John' },       two : { text : 'International Business Machines' } } ] }, 
 *                       { type : 'basedIn', 
 *                         entities : { one : { type : 'ORGANIZATION' }, two : { type : 'GPE' } }, 
 *                         mentions : [ { one : { text : 'IBM' },      two : 'England' } ] } ]
 */
function collectRelationshipMentions(options, entities, mentions, relationships) {

    return relationships.map(function (relationship) {

        // for each relationship in the provided list, prepare 
        //   a new representation of the relationship info that
        //   will be used in the response
        var response = {
            type : relationship.type,
            entities : {},
            mentions : []
        };

        // only the temporary relationships have subtypes
        if (relationship.type === 'timeOf') {
            response.subtype = relationship.subtype;
        }

        // copy the first entity info into the relationship 
        response.entities.one = entities[relationship.rel_entity_arg[0].eid];
        // remove the values not needed for describing relationships
        delete response.entities.one.mentref;
        delete response.entities.one.score;

        // copy the second entity info into the relationship 
        response.entities.two = entities[relationship.rel_entity_arg[1].eid];
        // remove the values not needed for describing relationships
        delete response.entities.two.mentref;
        delete response.entities.two.score;

        // for each instance where this relationship is found in the text...
        getAsArray(relationship.relmentions.relmention).forEach(function (relmention) {
            // get the descriptions of the mentions referred to by ID
            relmention.one = mentions[relmention.rel_mention_arg[0].mid];
            relmention.two = mentions[relmention.rel_mention_arg[1].mid];
            // remove the values no longer needed
            delete relmention.rel_mention_arg;
            delete relmention.one.scores;
            delete relmention.two.scores;
            delete relmention.rmid;

            if (options.includeScores) {
                // scores are returned by the API as strings despite being
                //  doubles (between 0 and 1)
                // convert here to make it easier for clients to consume 
                relmention.score = parseFloat(relmention.score);
            }
            else {
                delete relmention.score;
            }

            // add to the list of mentions of this relationship
            response.mentions.push(relmention);
        });

        return response;
    });
}


/**
 * getRequestOptions()
 * 
 *   Prepares an object that can be used as a parameter for request.
 * 
 *   It will get values from the Bluemix environment if this is available, 
 *    otherwise it will use the provided options object.
 * 
 * @param {Object} object which may contain an api object with API credentials
 * @returns object with parameters for a HTTP request
 * @throws error if no credentials are available
 */
function getRequestOptions(options) {

    // these are the values that will be the same for all requests
    var requestoptions = {
        method  : 'POST', 
        headers : { 'Content-Type' : 'application/x-www-form-urlencoded' },
        // this is a default, which may be changed later
        form    : { sid : 'ie-en-news' }
    };    

    // these are the values that we need to find
    var url, username, password;

    if (process.env.VCAP_SERVICES) {
        // if we're running in a Bluemix environment, we 
        //  will use the credentials provided by Bluemix in the
        //  VCAP_SERVICES environment variable
        var bluemixservices = JSON.parse(process.env.VCAP_SERVICES);
        if (bluemixservices.relationship_extraction) {
            var svc = bluemixservices.relationship_extraction[0].credentials;
            requestoptions.url = svc.url;
            requestoptions.auth = { 
                user : svc.username, 
                pass : svc.password
            };

            // this is now everything needed to submit the request
            return requestoptions;
        }
        else {            
            console.log('Running in a Bluemix application that has not been bound to a Relationship Extraction service');
        }
    }

    if (options.api && options.api.url && options.api.user && options.api.pass) {
        requestoptions.url = options.api.url;
        requestoptions.auth = { user : options.api.user, pass : options.api.pass };

        // this is now everything needed to submit the request        
        return requestoptions;
    }

    throw new Error('No authentication credentials provided for Watson Relationship Extraction service');
}


/** @constant {Object} - options to be used if none provided by the client. */
var DEFAULT_OPTIONS = {
    // if true, entities found in the text should be returned
    //  together with the mentions of each entity
    includeMentions : true, 

    // if true, relationships found between entities in the text
    //  are returned, with the mention of each relationship
    includeRelationships : false, 

    // if true, the locations of items found in the text should
    //  be included, as offsets into the input text
    includeLocations : false,

    // if true, confidence scores in each item returned by the
    //  API should be included in the response
    includeScores : true,

    // if true, unique IDs will be included with objects returned
    //  in the response
    includeIds : false
};



/**
 * extract()
 * 
 *  Invokes the Watson Relationship Extraction service and 
 *  parses and restructures the response. 
 * 
 * @param {String} text - text to be submitted to the extraction service
 * @param {Object} [options] - options to customize the data that is returned (optional)
 *                   This can contain:
 *                    {Boolean} includeMentions - If true, entities found in the text 
 *                                                 are returned, with the mentions of 
 *                                                 each entity 
 *                                                Defaults to true
 *                    {Boolean} includeRelationships - If true, relationships found between
 *                                                      entities in the text are returned, 
 *                                                      with the mention of each relationship.
 *                                                     Defaults to false
 *                    {Boolean} includeLocations - If true, the locations of items found 
 *                                                  in the text are returned, as offsets
 *                                                  into the input text. 
 *                                                 Defaults to false
 *                    {Boolean} includeScores - If true, the confidence scores in each 
 *                                               item returned by the API is included in
 *                                               the response. 
 *                                              Scores are returned as doubles between 0 and 1.
 *                                              Defaults to true
 *                    {Boolean} includeIds - If true, unique IDs for entity and mention objects
 *                                             are included in the response. 
 *                    {String} dataset - the dataset to use for entity extraction
 *                                        Defaults to ie-en-news
 *                    {Object} api - Containing url, user and pass strings
 *                                     Required when not running in a Bluemix environment
 * @param {Function} callback - called once complete
 */
module.exports.extract = function extract(text) {

    //
    // validate input
    //

    if (arguments.length < 2 || arguments.length > 3) {
        throw new Error('Incorrect arguments. Usage: extract(<text to parse>, [options], callback)');
    }

    if (text) {
        if (typeof text !== 'string') {
            throw new Error('First parameter is required and should be the text to parse');
        }
    }
    else {
        throw new Error('text is required');
    }

    var options;
    var callback;

    if (arguments.length === 2 && typeof arguments[1] === 'function') {
        options = DEFAULT_OPTIONS;
        callback = arguments[1];
    }
    else if (arguments.length === 3 && typeof arguments[1] === 'object' && typeof arguments[2] === 'function') {
        options = arguments[1];
        callback = arguments[2];

        // copy missing options from the default set
        Object.keys(DEFAULT_OPTIONS).forEach(function (defaultOption) { 
            if (defaultOption in options === false) { 
                options[defaultOption] = DEFAULT_OPTIONS[defaultOption];
            }
        });
    }
    else {
        throw new Error('Incorrect arguments. Usage: extract(<text to parse>, [options], callback)');
    }



    //
    // prepare API request
    // 

    var requestoptions;
    try {
        requestoptions = getRequestOptions(options);
    }
    catch (err) {
        return callback(err);        
    }

    requestoptions.form.txt = text;

    if (options.dataset) {
        requestoptions.form.sid = options.dataset;
    }



    //
    // prepare the parser for the XML format used by 
    //   the Relationship Extraction service
    //

    var entities = {};
    var mentions = {};
    var relationships = [];

    // the sections of the XML to parse - ignoring the sections that seem 
    //  less useful such as the original input text, and the sentence 
    //  parse and dependency parse trees
    var parser = new xml2object([ 'mentions', 'entities', 'relations' ]); 

    parser.on('object', function (name, obj) {

        // Parsing the XML returned by the API using a streaming parser 
        //  This is called for each of the XML entities specified in the
        //  constructor above (mentions, entities, relations) letting us
        //  parse the streamed XML in sections.

        if (name === 'entities') {

            getAsArray(obj.entity).forEach(function (entity) {
                // objects are returned as arrays - we restructure
                //  them into objects indexed by id to let us 
                //  reference items in the array by id
                entities[entity.eid] = entity;

                if (options.includeIds){
                    entity.id = cleanId(entity.eid);
                }

                // entities are indexed by entity id (eid)
                //  so this isn't needed within the object
                delete entity.eid;

                // remove the unused placeholder value
                delete entity.generic;

                // remove placeholder subtype values
                if (entity.subtype === 'OTHER') {
                    delete entity.subtype;
                }

                if (options.includeScores) {
                    // scores are returned by the API as strings despite being
                    //  doubles (between 0 and 1)
                    // convert here to make it easier for clients to consume 
                    entity.score = parseFloat(entity.score);
                }
                else {
                    delete entity.score;
                }
            });

        }
        else if (name === 'mentions') {

            getAsArray(obj.mention).forEach(function (mention) {
                // objects are returned as arrays - we restructure
                //  them into objects indexed by id to let us 
                //  reference items in the array by id
                mentions[mention.mid] = mention;

                if (options.includeIds){
                    mention.id = cleanId(mention.mid);
                }

                // mentions are indexed by id, so these
                //  aren't needed within the object
                delete mention.mid;
                delete mention.eid;
                
                // remove the unused placeholder value
                delete mention.metonymy;

                // rename the '$t' value which stores the covered text
                mention.text = mention.$t;
                delete mention.$t;

                // 
                // group the remaining attributes to make them clearer
                //

                if (options.includeScores) {
                    mention.scores = {
                        // scores are returned as strings, so while
                        //  restructuring we also parse them into 
                        //  doubles to make them usable by clients
                        score : parseFloat(mention.score),
                        coref : parseFloat(mention.corefScore)
                    };
                }
                delete mention.score;
                delete mention.corefScore;

                if (options.includeLocations) {
                    mention.location = {
                        begin : parseInt(mention.begin, 10),
                        end : parseInt(mention.end, 10),
                        'head-begin' : parseInt(mention['head-begin'], 10),
                        'head-end' : parseInt(mention['head-end'], 10)
                    };
                }
                delete mention.begin;
                delete mention.end;
                delete mention['head-begin'];
                delete mention['head-end'];                
            });

        }
        else if (name === 'relations') {

            relationships = getAsArray(obj.relation);

        }
    });

    
    parser.on('end', function () {

        // finished parsing the XML - the objects that we pulled out
        //  are now in the entities, mentions and relationships objects
        //  defined above

        // restructure them before returning

        var response = {};
        if (options.includeMentions) {
            response.entities = collectEntityMentions(clone(entities), mentions);
        }
        if (options.includeRelationships) {
            response.relationships = collectRelationshipMentions(options, entities, mentions, relationships);
        }

        return callback(null, response);
    });

    // parser has been prepared


    //
    // submit the API request
    //

    request(requestoptions)
        .on('error', function (err) {
            // failure to submit request
            return callback(err);
        })
        .on('response', function (rsp) {
            if (rsp.statusCode === httpstatus.OK) {
                // only start the parser if the API request was successful
                rsp.pipe(parser.saxStream);
            }
            else {
                // return error code - probably not-authorised if the 
                //  wrong user/pass was provided
                var errorMessage = 'Received ' + httpstatus[rsp.statusCode] + ' from server';
                return callback(new Error(errorMessage));
            }
        });
};
