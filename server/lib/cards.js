// This module is used to get card details
// Currently only used on home page
var settings = require('../resources/settings.json'),
    mClient = require('mongodb').MongoClient,
    auth = require('./auth.js');

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
    layCard: function(cb,part,muser){
        var permis = null,
            Self = this,
            send = null,
            filt = {"web-part": "card", "access": { $in: ["public"] }};
            if(part!==null && part !=="undefined"){ filt["web-part"] = part; }
            auth.verify(muser,function(usr){   
                permis = usr.access;                         
                if(permis!==null && permis !=="undefined"){ 
                    if(Array.isArray(permis)){                        
                        filt["access"]["$in"] = permis;
                        filt["access"]["$in"].push("public");
                    } else { filt["access"].$in.push(permis); }
                }
                Self.draw(function(card){
                    send = "<div class='page-tile' open-new='"+card.openNew+"' id='"+card.name+"' href='"+card.path+"'>"+card.note+"</div>";
                    cb(send,card);
                }, filt );
            });
    },
    layScript: function(cb,muser,select){
        select = (select) ? select : "default";
        var Self = this,
            send = null,
            filt = {"web-part": "script", "access": { $in: ["public"] },"group":select};
            auth.verify(muser,function(usr){
                permis = usr.access;                         
                if(permis!==null && permis !=="undefined"){ 
                    if(Array.isArray(permis)){                        
                        filt["access"]["$in"] = permis;
                        filt["access"]["$in"].push("public");
                    } else { filt["access"].$in.push(permis); }
                }
                Self.draw(function(card){            
                    cb(card);
                }, filt );
            });
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
        var Self = this,
            send = null;
        Self.content(title,function(content){
            send = "<div class='center-er'><div class='page-content' id='"+content.name+"'><h2>"+content.title+"</h2>"+content.data+"</div></div>";
            cb(send);
        });
    }
}