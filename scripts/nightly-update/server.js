/*
to do:
it would make sense to just remove duplicate pantries from the AGOL service so we can just use AgencyID as the actual indexed field when updating the AGOL service
*/

var fs = require('fs');
var path = require('path');
var Geoservices = require('geoservices');
var client = new Geoservices();
var parse = require('csv-parse');

var today = new Date();
// we'll add 17 hours instead of 24
// because .toUTCString() returns a GMT timestamp 7 hours ahead of the time in LA
var tomorrow = today.setHours(today.getHours()+17);
var tomorrowHuman = new Date(tomorrow).toUTCString().substring(0,3)

var params = {
  url: 'http://services.arcgis.com/uCXeTVveQzP4IIcx/arcgis/rest/services/LAFoodPantries/FeatureServer/0'
};

var pantries = new client.featureservice(params, function (err, res) {
    if (!err) {
      // do something
    }
});

var templateRecord = {
  attributes: {
    FID: null,
    Tomorrow: 'YES'
  }
}

// create an empty object to pass bulk edits later
var edit_params = { updates: [] };

/* these are the parameters we'll pass to the AGOL service when querying
ex:
http://services.arcgis.com/uCXeTVveQzP4IIcx/arcgis/rest/services/LAFoodPantries/FeatureServer/0/query?where=Agency_No_ IN (1,2,3)&outFields=*&returnIdsOnly=true&f=pjson
*/
var query_params = {
        f: 'json',
        returnGeometry: true,
        where: 'placeholder',
        returnIdsOnly: true,
      };

var pantriesOpenTomorrow = [];

// we'll use a IN sql filter to search for Agency matches: ex: 'Agency_No IN (1,2,3)'
var tomorrowSqlFilter = 'Agency_No_ IN (';

var parser = parse({delimiter: ','}, function(err, data){
	if(data){
    // resetFeatureService();
    postForTomorrow(data);
	}
});

// this function writes 'YES' in the Tomorrow field of the service if a record is found in the CSV for an agency with a matching day name
var postForTomorrow = function (data) {
  /*
  loop through the every row in the CSV (starting with the second)
  pull out all agency numbers for rows that have a value in 'Day of the Week' field for tomorrow
  */
  for (var i = 1; i < data.length; i++) {
    if (tomorrowHuman === data[i][8].substring(0,3)) {
      pantriesOpenTomorrow.push(data[i][0]);
      tomorrowSqlFilter += data[i][0] + ', ';
    }
  }
  query_params.where = tomorrowSqlFilter.slice(0, -2) + ')';

  // query the service for all the matching FIDs
  pantries.query(query_params, function (err, res) {
    if (!err) {
      // loop through the FIDs and bulk update the matches for tomorrow
      for (var j=0; j < res.objectIds.length; j++ ) {
        templateRecord.attributes.FID = res.objectIds[j];
        edit_params.updates.push({
          attributes: {
            FID: res.objectIds[j],
            Tomorrow: 'YES'
          }
        });
      }
      pantries.edit(edit_params, function (err, res) {
        // if all is well, lets get out of here
        if (!err) {
          console.log('done.');
        }
      });
    }
  });
}

// this function clears all features of information about Tomorrow's distribution
var resetFeatureService = function () {
  query_params.where = '1=1',

  pantries.query(query_params, function (err, res) {
    if (!err) {
      // loop through the FIDs and bulk update the matches for tomorrow
      for (var j=0; j < res.objectIds.length; j++ ) {
        templateRecord.attributes.FID = res.objectIds[j];
        edit_params.updates.push({
          attributes: {
            FID: res.objectIds[j],
            Tomorrow: null
          }
        });
      }
      pantries.edit(edit_params, function (err, res) {
        // if all is well, lets get out of here
        if (!err) {
          console.log('back to ground zero.');
        }
      });
    }
  });
}

fs.createReadStream(path.join(__dirname, '../../AgencyList/') + 'AgencyList.csv').pipe(parser);
