var settings = require('../resources/settings.json'),
    cookie_duration_days = settings.cookie_duration_days,
    mClient = require('mongodb').MongoClient,
    password = require('password-hash'),
    rstring = require('randomstring'),
    is = require('is_js'),
    moment = require('moment');

var validateRegister = function(creds){
    credsG=creds;
    if(creds.username.length < 6 || creds.username === "undefined" || creds.username === null){ return "Please enter a valid username, hover over the field for rules"; }
    if(!is.email(creds.email)){ return "Please enter a valid email address"; }
    if(creds.password.length < 6 || creds.password === "undefined" || creds.password === null){ return "Please enter a valid password, hover over the field for rules" }
    if(creds.password !== creds.vpassword){ return "Password and verify password don't match, please double check the password" }
    return true;
};

module.exports = {
    register: function(creds,cb){
        var validate = validateRegister(creds);
        if(validate){
            var pwHash = password.generate(creds.password),
                insert = { "username":creds.username,"email":creds.email,"password":pwHash, "access":"default" };
                mClient.connect(settings.db_path, function(err, db){
                if(err){ console.error("Error connecting to database for auth.register: " + err); }
                else {
                    var auth = db.collection("auth");
                    auth.findOne({$or: [{"username":creds.username},{"email":creds.email}]}, function(err, doc){
                        if(doc){ cb(false,"Username or email already in use"); db.close(); }
                        else {
                            auth.insertOne(insert,function(err,res){                        
                                if(err){ 
                                    cb(false,"DB Error, failed to add user"); 
                                    console.error("Error inserting for auth.register: "+err);
                                }
                                else { cb(true,null); }
                                db.close();
                            });  
                        }       
                    });
                }   
            });
        }
        else {
            cb(false,validate);
        }
    },
    login: function(creds,cb){
            mClient.connect(settings.db_path, function(err, db){
                if(err){ console.error("Error connecting to database for auth.login: " + err); }
                else {
                    var auth = db.collection("auth"),
                        cook = db.collection("cookies");
                    auth.findOne({$or: [{"username":creds.username},{"email":creds.username}] }, function(err, doc){
                        if(doc){
                            var pwVer = password.verify(creds.password,doc.password),
                                cookie_hash = rstring.generate(64),
                                expires = moment().day(cookie_duration_days).toDate();
                            if(pwVer){
                                cook.update({"username": creds.username},{$push:{ "cookies": {"hash": cookie_hash, "expires": expires} }},{upsert: true},function(err,res){
                                    cb(true,{"username": creds.username,"cookie":{"hash": cookie_hash, "expires": expires}}); 
                                    db.close();
                                });                                
                            }
                            else { cb(false,"Invalid username or password"); db.close(); }
                        }
                        else {
                            cb(false,"User or email not found."); db.close();
                        }
                    });
                }
            });
    },
    verify: function(muser,cb){
        if(!muser){ cb(false); return; }
        if(!muser.hasOwnProperty("username")){ cb(false); return; }
        if(!muser.hasOwnProperty("cookie")){ cb(calse); return; }
        if(!muser.cookie.hasOwnProperty("hash")){ cb(false); return; }
        var username = muser.username,
            cookie = muser.cookie.hash;
        if(!Array.isArray(cookie)){ cookie = [cookie]; }
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for auth.verify: " + err); db.close(); }
            else {
                var auth = db.collection("auth"),
                    cook = db.collection("cookies"),
                    findME = {"username":muser.username,"cookies.hash": {$in: cookie},"cookies.expires": {$gte: new Date()}};
                cook.findOne(findME, function(err, doc1){
                    if(!doc1){ cb(false); db.close(); return; }
                    auth.findOne({"username": muser.username},function(err,doc){
                        if(doc){
                            if(cb){ cb(doc); } 
                        } else { if(cb){ cb(false); } }                                       
                        db.close();
                    });
                });
            }
        });
    }

}
