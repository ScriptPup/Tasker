var settings = require('../resources/settings.json'),
    cookie_duration_days = settings.cookie_duration_days,
    mClient = require('mongodb').MongoClient,
    moment = require('moment'),
    auth = require('./auth.js'),
    scheduleDB = null,
    queueDB = null,
    scriptsDB = null;
mClient.connect(settings.db_path, function(err, db){
    if(err){ console.error("Error connecting to database for log.pull: " + err); }
    scheduleDB = db.collection('schedule');
    scheduleDB = db.collection('queue');
    scriptsDB = db.collection('scripts');
});

module.exports = {
    add: function(name, group, time, muser, cb){
        var sched = {
            name: name,
            group: group,
            at: time,
            scheduledBy: muser.username,
            scheduleTime: moment().toDate()
        };
        auth.verify(muser,function(){
            var permis = usr.access;                         
            if(permis!==null && permis !=="undefined"){ 
                if(Array.isArray(permis)){ 
                    permis.push("public");
                } else { permis = [permis,"public"]; }
            }
            scripts.findOne({"name":name,"access":{$in: permis}},function(err,doc){
                if(!doc){ cb(false,"Access denied"); return; }                    
                
            });
        });
    }

}