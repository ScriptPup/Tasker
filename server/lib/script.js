// This module is used to run scripts from the db
var settings = require('../resources/settings.json'),
    auth = require('./auth.js'),
    mClient = require('mongodb').MongoClient,
    spawn = require('child_process').spawn,
    queueTicker = null,
    queueTickInterval = (5*60*1000),
    queueStarted = false,
    queueRunning = 0,
    queueMaxRunning = 10,
    moment = require('moment'),
    results = require('./results.js'),
    logging = require('./logging.js');

module.exports = {
    get: function(name,cb){
        var filt = {"name":name };
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for scripts.get: " + err); }
            else {
                var map = db.collection('scripts');
                map.find(filt).each(function(err, doc){
                    if(err){ console.error("Error querying for scripts.get: " + err); }
                    else if(doc) {
                        cb(doc);
                    }
                    db.close();
                });
            }          
        });
    },
    update: function(which,name,ud,cb){
        var filt = {"name":name };
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for scripts.get: " + err); }
            else {
                var scripts = db.collection(which);
                scripts.update(filt,{$set: ud},function(err,res){
                    if(err){ console.error("Failed to update status: "+err); }
                    if(cb){ cb(); }
                });
                db.close();
            }  
        });
    },
    statusUpdate: function(name,nStat,cb){
        var filt = {"name":name };
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for scripts.get: " + err); }
            else {
                var scripts = db.collection('scripts');
                scripts.update({"name":name},{$set: {"status": nStat, "last-run": moment().toDate()}},function(err,res){
                    if(err){ console.error("Failed to update status: "+err); }
                    if(cb){ cb(); }
                });
                db.close();
            }  
        });
    },
    run: function(name,ondata,onexit){
        var Self = this;
        Self.get(name,function(inf){
            var args = [inf.path, inf.args],
                erred = false;
            if(inf.run.includes("powershell")){ args = ["-ExecutionPolicy","ByPass", "-File", inf.path] }
            args = args.concat(inf.args.split(" "));
            var nSpawn = spawn(inf.run,args);
            nSpawn.stdout.on("data",function(data){
                if(ondata){ ondata(data); }
            });
            nSpawn.stderr.on("data",function(data){
                erred = true;
                Self.statusUpdate(name,"Error, check script",function(){
                       
                    });  
                console.error(data.toString());
            });
            nSpawn.on("exit",function(){
                if(!erred){
                    Self.statusUpdate(name,"Complete",function(){
                        
                        if(onexit){ onexit(true); }
                    });     
                } else { if(onexit){ onexit(false); } }
            });
            nSpawn.stdin.end(); //end input
            Self.statusUpdate(name,"Running");
        });
    },
    test: function(name,ondata,onexit){
        var Self = this;
        Self.get(name,function(inf){
            inf = inf.test;
            var args = [inf.path, inf.args];
            if(inf.run.includes("powershell")){ args = ["-ExecutionPolicy","ByPass", "-File", inf.path] }
            args = args.concat(inf.args.split(" "));
            var nSpawn = spawn(inf.run,args);
            nSpawn.stdout.on("data",function(data){
                var ud = {"test.status": data.toString(), "test.last-run": moment().toDate()};
                Self.update("scripts",name,ud,function(){                    
                    if(ondata){ ondata(data); }
                });                
            });
            nSpawn.stderr.on("data",function(data){
                
                console.error(data.toString());
            });
            nSpawn.on("exit",function(){
                if(onexit){ onexit(true); }
            });
            nSpawn.stdin.end(); //end input
        });
    },
    getQueue: function(name,when,cb){
        var Self = this;
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for queue.get: " + err); }
            else {
                var queue = db.collection("queue"),
                    filt = { };
                if(name){ filt.name = name; };
                if(when){ filt.when = when; }
                queue.find(filt).each(function(err, doc){
                    if(err){ console.error("Error searching database for queue.get: " + err); } 
                    else{ if(cb){ cb(doc); } }                   
                    db.close();
                });
            }  
        });        
    },
    queue: function(name,muser,at,io){
        at = (at) ? at : "1990-01-01 8:00:00 AM";
        var Self = this,
            job = {"name":name,"added": moment().format("YYY-MM-DD hh:mm:ss A"),"when":at};
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for queue.send: " + err); }
            else {
                var scripts = db.collection("scripts"),
                    queue = db.collection("queue");
                auth.verify(muser,function(usr){   
                    permis = usr.access;                         
                    if(permis!==null && permis !=="undefined"){ 
                        if(Array.isArray(permis)){ 
                            permis.push("public");
                        } else { permis = [permis,"public"]; }
                    }
                    scripts.findOne({"name":name,"access":{$in: permis}},function(err,doc){
                        if(!doc){ Self.statusUpdate(name,"Failed to queue - Access Denied"); db.close(); return; }                    
                        queue.insertOne(job, function(err,res){
                            if(err){
                                Self.statusUpdate(name,"Failed to queue");
                                io.of('/home').emit('update-script',name,{"status":"Failed to queue"});
                            } else {
                                logging.add(name,"Script queued by "+usr.username,io);
                                Self.statusUpdate(name,"Queued");
                                Self.startQueue(io);
                                io.of('/home').emit('update-script',name,{"status":"Queued"});
                            }                    
                            db.close();
                        });      
                    });   
                });       
            }
        });     
    },
    unqueue: function(name,io){
        //console.log(io);
        var Self = this,
            filter = {"name":name};
        mClient.connect(settings.db_path, function(err, db){
            if(err){ console.error("Error connecting to database for queue.unqueue: " + err); }
            else {
                var queue = db.collection("queue");
                queue.remove(filter, function(err,res){
                    if(err){
                        console.error("Failed to remove document from queue");
                    } else { logging.add(name,"Script removed from queue by system.",io); }               
                    db.close();
                });                
            }
        });
    },
    startQueue: function(io){
        var Self = this,       
        queueRunActions = function(name,io,script){
            gio = io;
            io.of('/home').emit('update-script',name,{"status":"Running...","last-run": "Now"});
            script.run(name,null,function(res){
                if(res){
                    script.test(name,null,function(){
                        script.get(name,function(ud){
                            queueRunning--;                            
                            script.unqueue(name,io);
                            queueTick(io,script);                            
                            io.of('/home').emit('update-script',name,ud);
                        });
                    });
                } else {
                    script.get(name,function(ud){
                        io.of('/home').emit('update-script',name,ud);

                    });
                }
            });
        },
        queueTick = function(io,script){
            if(queueRunning < queueMaxRunning){
                script.getQueue(null,null,function(queued){
                    if(queued){
                        if(queueRunning < queueMaxRunning){
                            queueRunning++;
                            queueRunActions(queued.name,io,script);
                            logging.add(queued.name,"Queued script started.",io);
                        }
                    }
                });
            }
        }
        queueTick(io,Self);
        if(!queueStarted){
            queueStarted = true;
            queueTicker = setInterval(function(){
                queueTick(io,Self);
            }, queueTickInterval)
        }
    }


}