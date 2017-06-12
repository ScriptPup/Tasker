var settings = require('../resources/settings.json'),
    cookie_duration_days = settings.cookie_duration_days,
    mClient = require('mongodb').MongoClient,
    moment = require('moment');

module.exports = {
    init: function(io){
        var Self = this;
        io.of('results').on('connection',function(socket){
            socket.C_context = null;
            socket.on('results-connect',function(script){
                socket.join(script);
                Self.send(script,socket);
            });
        });
    },
    add: function(script,data){
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for results.add: " + err); db.close(); return; }
            else {
                var results = db.collection('results'),
                    nres = {
                        'date': moment().toDate(),
                        'script': script,
                        'data': data
                    };
                results.insert(nres,function(err, res){
                    if(err){ console.error("Error inserting to database for results.add: " + err); }
                    db.close();
                });
            }          
        });
    },
    pull: function(script,cb){
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for results.pull: " + err); }
            else {
                var filt = {"script": script},
                    results = db.collection('results');
                results.find(filt).each(function(err, doc){
                    if(err){ console.error("Error querying for results.pull: " + err); }
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
            socket.emit('results',doc);
        });
    },
    sendAll: function(script,doc){
        io.of('results').in(script).emit('results',doc);
    }
}