"use strict";

var prt = process.env.PORT || 4432,
    app = require('express')(),
    http = require('http').Server(app),
    serveStatic = require('serve-static'),
    io = require('socket.io')(http),
    // io = new server(prt),
    fs = require('fs'),
    path = require('path'),
    staticBasePath = path.join(__dirname,'..','front-end',"http"),
    base = path.join(__dirname,'..','front-end',"http","index.html"),
    cards = require('./lib/cards.js'),
    script = require('./lib/script.js');

app.use(serveStatic(staticBasePath, {'index': "index.html"}));
var listen = http.listen(prt,function(){
    console.log("Listening on port:"+listen.address().port);
});
// 404 handling
app.use(function(req, res, next){
    res.sendFile(base);
});


io.on('connection', function(socket){

});
io.of('auth').on('connection',function(socket){
    socket.on('login', function(creds){

    });
    socket.on('resume', function(creds){

    });
});
io.of('home').on('connection', function(socket){
    // Maybe add some logging about connections?
    socket.on('cards', function(opts){
        cards.layCard(function(card,opts){
            script.get(name,function(ud){
                socket.emit('update-script',name,ud);
            });
            socket.emit('lay-card',card);
        },"card",null);
    });
    socket.on('run-script',function(name){
        io.of('/home').emit('update-script',name,{"status":"Running...","last-run": "Now"});
        var ondata = function(data){ console.log(data.toString()); },
            onexit = function(data){ console.log(data).toString(); };
        script.run(name,ondata,function(res){
            if(res){
                script.test(name,null,function(){
                    script.get(name,function(ud){
                        io.of('/home').emit('update-script',name,ud);

                    });
                });
            } else {
                script.get(name,function(ud){
                    io.of('/home').emit('update-script',name,ud);

                });
            }
        });
    });
    socket.on('script',function(opts){
        cards.layScript(function(card,opts){
            script.get(card.name,function(ud){
                socket.emit('update-script',card.name,ud);
            });
            socket.emit('lay-script',card);
        },null);
    });
    socket.on('content',function(title){
        cards.layContent(title, function(content){
            socket.emit('lay-content',content);
        });
    });
});