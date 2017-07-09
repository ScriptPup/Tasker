var settings = require('../resources/settings.json'),
    cookie_duration_days = settings.cookie_duration_days,
    mClient = require('mongodb').MongoClient,
    moment = require('moment'),
    resultsDB = null;

mClient.connect(settings.db_path, function(err, db){
    if(err){ console.error("Error connecting to database for results: " + err); }
    resultsDB = db.collection('results');
});

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
    add: function(script,data,io){
        if(!resultsDB){ console.error("logDB not connected yet."); return; }
        var Self = this;     
                nresults = {
                    'date': moment().toDate(),
                    'script': script,
                    'data': data
                };
            resultsDB.insert(nresults,function(err, res){
                if(err){ console.error("Error inserting to database for results.add: " + err); }
                Self.sendAll(script,nresults,io);
            });
    },
    pull: function(script,cb){
        if(!resultsDB){ console.error("logDB not connected yet."); return; }
        var filt = {"script": script};
        resultsDB.find(filt).each(function(err, doc){
            if(err){ console.error("Error querying for results.pull: " + err); }
            else if(doc) {
                cb(doc);
            }
        });            
    },
    send: function(script,socket){
        var Self = this;
        Self.pull(script,function(doc){
            socket.emit('results',doc);
        });
    },
    sendAll: function(script,doc,io){
        //console.results(doc); console.results((io) ? true : false);
        io.of('results').in(script).emit('results',doc);
    }
}