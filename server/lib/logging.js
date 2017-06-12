var settings = require('../resources/settings.json'),
    cookie_duration_days = settings.cookie_duration_days,
    mClient = require('mongodb').MongoClient,
    moment = require('moment');

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
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for logs.add: " + err); db.close(); return; }
            else {
                var log = db.collection('logs'),
                    nlog = {
                        'date': moment().toDate(),
                        'script': script,
                        'data': data
                    };
                log.insert(nlog,function(err, res){
                    if(err){ console.error("Error inserting to database for logging.add: " + err); }
                    Self.sendAll(script,nlog,io);
                    db.close();
                });
            }          
        });
    },
    pull: function(script,cb){
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for log.pull: " + err); }
            else {
                var filt = {"script": script},
                    logs = db.collection('logs');
                logs.find(filt).each(function(err, doc){
                    if(err){ console.error("Error querying for log.pull: " + err); }
                    else if(doc) {
                        cb(doc);
                    }
                    db.close();
                });
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