// This module is used to get card details
// Currently only used on home page
var settings = require('../resources/settings.json'),
    mClient = require('mongodb').MongoClient,
    auth = require('./auth.js'),
    moment = require('moment'),
    paradigm = require('./paradigm.js'),
    mapDB = null,
    contentDB = null;
    mClient.connect(settings.db_path, function(err, db){
        if(err){ console.error("Error connecting to database for cards: " + err); }
        mapDB = db.collection("map");
        contentDB = db.collection("content");
    })

module.exports = {
    draw: function(cb,filter){        
        var filt = (filter!==null) ? filter : {"web-part": "card", "access": { "$in": ["public"] }};
        mapDB.find(filt, { collation: { locale: 'en', strength: 2 } }).each(function(err, doc){
            if(err){ console.error("Error querying for cards.draw: " + err); }
            else if(doc) {
                cb(doc);
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
        var map = db.collection('content');
        contentDB.find({"name": title}).each(function(err, doc){
            if(err){ console.error("Error querying for cards.draw: " + err); }
            else if(doc) {
                cb(doc);
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
    },
    addCard: function(cardData,cb){
        var filt = { "web-part": "card", "name": cardData.name };
        mapDB.findOne(filt,function(err, doc){
            if(err){ console.error("Error querying map for cards.addCard " + err); if(cb){ cb("Failed to check existing ScriptGroups - try again later or contact your site admin."); } }
            else {
                cardData.added = moment().toDate();
                cardData["web-part"] = "card";
                cardData.path = cardData.name;
                cardData.openNew = false;
                mapDB.insert(cardData,function(err,record){
                    if(err){ console.error("Error inserting for cards.addCard " + err); if(cb){ cb("Failed to create new group - try again later or contact your site admin."); } }
                    else if(cb && record){ 
                        if(record.hasOwnProperty("ops")){
                            var card = record.ops[0],
                                send = "<div class='page-tile' open-new='"+card.openNew+"' id='"+card.name+"' href='"+card.path+"'>"+card.note+"</div>";
                            cb(true,send); 
                        }
                    }
                });
            }
        });
        paradigm.addGroups(cardData.access);
    },
    removeCard: function(Card){
        var filt = { "web-part": "card", "name": Card };
        mapDB.deleteOne(filt, function(err,res){
            if(err){ console.error("Error removing for cards.removeCard " + err); }
        });
    }
}