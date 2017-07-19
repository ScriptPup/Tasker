var settings = require('../resources/settings.json'),
    mClient = require('mongodb').MongoClient,
    auth = require('./auth.js'),
    pDB = null;
mClient.connect(settings.db_path, function(err, db){
    if(err){ console.error("Error connecting to database for paradigm: " + err); }
    pDB = db.collection('paradigm');
});

module.exports = {
    getGroups: function(cb){
        pDB.find({name:"groups"}).each(function(err, doc){
            if(err){ console.error("Error querying to database for paradigm.getGroups"); return; }
            if(cb && doc !== null && doc !== "" && doc !== "undefined"){ cb(doc.items); }
        })
    },
    addGroups: function(groups){
        pDB.updateOne(
            {name: 'groups'},
            {$addToSet: { items: {$each: groups} } },
            function(err,res){
                if(err){ console.error("Failed to update group entry in paradigm.addGroups " + err); }
            }
        );
    },
    getTypes: function(cb){
        pDB.find({name:"scriptTypes"}).each(function(err,doc){
            if(err){ console.error("Error querying to database for paradigm.scriptTypes"); return; }
            if(cb && doc !== null && doc !== "" && doc !== "undefined"){ cb({"types": doc.items, "mods": doc.mods}); }            
        });
    }
}