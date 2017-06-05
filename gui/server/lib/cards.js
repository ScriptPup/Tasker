// This module is used to get card details
// Currently only used on home page
var settings = require('../resources/settings.json'),
    mClient = require('mongodb').MongoClient;

module.exports = {
    draw: function(cb,filter){
        var filt = (filter!==null) ? filter : {"web-part": "card", "access": { "$in": ["public"] }};
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for cards.draw: " + err); }
            else {
                var map = db.collection('map');
                map.find(filt).each(function(err, doc){
                    if(err){ console.error("Error querying for cards.draw: " + err); }
                    else if(doc) {
                        cb(doc);
                    }
                    db.close();
                });
            }          
        });
    },
    layCard: function(cb,part,permis){
        var Self = this,
            send = null,
            filt = {"web-part": "card", "access": { $in: ["public"] }};
            if(part!==null && part !=="undefined"){ filt["web-part"] = part; }
            if(permis!==null && permis !=="undefined"){ 
                if(Array.isArray(permis)){
                    for(var i=0; i<permis.length; i++){ filt["access"]["$in"].push(permis[i]); } 
                } else { filt["access"].$in.push(permis); }
            }
        this.draw(function(card){
            send = "<div class='page-tile' open-new='"+card.openNew+"' id='"+card.name+"' href='"+card.path+"'>"+card.note+"</div>";
            cb(send,card);
        }, filt );
    },
    layScript: function(cb,permis,select){
        console.log("Initial select "+select);
        select = (select) ? select : "default";
        console.log("Selecting Scripts "+select);
        var Self = this,
            send = null,
            filt = {"web-part": "script", "access": { $in: ["public"] },"group":select};
            if(permis!==null && permis !=="undefined"){ 
                if(Array.isArray(permis)){
                    for(var i=0; i<permis.length; i++){ filt["access"]["$in"].push(permis[i]); } 
                } else { filt["access"].$in.push(permis); }
            }
        this.draw(function(card){            
            cb(card);
        }, filt );
    },
    content: function(title, cb){
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for cards.draw: " + err); }
            else {
                var map = db.collection('content');
                map.find({"name": title}).each(function(err, doc){
                    if(err){ console.error("Error querying for cards.draw: " + err); }
                    else if(doc) {
                        cb(doc);
                    }
                    db.close();
                });
            }          
        });
    },
    layContent: function(title,cb){
        console.log("Content-lay requested " + title);
        var Self = this,
            send = null;
        this.content(title,function(content){
            send = "<div class='center-er'><div class='page-content' id='"+content.name+"'><h2>"+content.title+"</h2>"+content.data+"</div></div>";
            cb(send);
        });
    }
}