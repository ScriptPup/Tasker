var settings = require('../resources/settings.json'),
    mClient = require('mongodb').MongoClient,
    password = require('password-hash'),
    rstring = require('randomstring'),
    is = require('is_js');

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
                    var auth = db.collection("auth");
                    auth.findOne({$or: [{"username":creds.username},{"email":creds.username}] }, function(err, doc){
                        if(doc){
                            var pwVer = password.verify(creds.password,doc.password),
                                cookie_hash = rstring.generate(64);
                            if(pwVer){
                                auth.update({"username": creds.username},{$push:{ "cookies": cookie_hash }},function(err,res){
                                    cb(true,{"username": creds.username,"cookie": cookie_hash}); 
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
    }

}
