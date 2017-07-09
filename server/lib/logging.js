var settings = require('../resources/settings.json'),
    cookie_duration_days = settings.cookie_duration_days,
    mClient = require('mongodb').MongoClient,
    moment = require('moment'),
    logDB = null;
mClient.connect(settings.db_path, function(err, db){
    if(err){ console.error("Error connecting to database for log.pull: " + err); }
    logDB = db.collection('logs');
});


module.exports = {
    init: function(io){
        var Self = this;
        io.of('logs').on('connection',function(socket){
            socket.C_context = null;
            socket.on('log-connect',function(script){
                socket.join(script);
                Self.send(script,socket);
            });
        });
    },
    add: function(script,data,io){
        var Self = this;
            nlog = {
                'date': moment().toDate(),
                'script': script,
                'data': data
            };
        logDB.insert(nlog,function(err, res){
            if(err){ console.error("Error inserting to database for logging.add: " + err); }
            Self.sendAll(script,nlog,io);
        });
    },
    pull: function(script,cb){        
        var filt = {"script": script};
        logDB.find(filt).each(function(err, doc){
            if(err){ console.error("Error querying for log.pull: " + err); }
            else if(doc) {
                cb(doc);
            }
        });    
    },
    send: function(script,socket){
        var Self = this;
        Self.pull(script,function(doc){
            socket.emit('log',doc);
        });
    },
    sendAll: function(script,doc,io){
        //console.log(doc); console.log((io) ? true : false);
        io.of('logs').in(script).emit('log',doc);
    }
}