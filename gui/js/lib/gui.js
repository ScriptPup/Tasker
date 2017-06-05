requirejs.config({
    shim: {
        "socketio": {
            exports: 'io'
        }
    },
    paths: {
        socketio: '/js/lib/socket.io/dist/socket.io.slim'
    }
});

define(['socketio'], function(io){
    var UpdateQueryString = function(key, value, url) {
        if (!url) url = window.location.href;
        var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
            hash;

        if (re.test(url)) {
            if (typeof value !== 'undefined' && value !== null)
                return url.replace(re, '$1' + key + "=" + value + '$2$3');
            else {
                hash = url.split('#');
                url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
                if (typeof hash[1] !== 'undefined' && hash[1] !== null) 
                    url += '#' + hash[1];
                return url;
            }
        }
        else {
            if (typeof value !== 'undefined' && value !== null) {
                var separator = url.indexOf('?') !== -1 ? '&' : '?';
                hash = url.split('#');
                url = hash[0] + separator + key + '=' + value;
                if (typeof hash[1] !== 'undefined' && hash[1] !== null) 
                    url += '#' + hash[1];
                return url;
            }
            else
                return url;
        }
    },
    self = this;
    $('.goHome').off('click');
    $('.goHome').click(function(){
        window.location.href = "/";
    });
    return {
        loadPage: function(){
            var Self = this;
            if($('.main-body').length>0){ $('.main-body').empty(); }         
            // If server hosting is localhost, then connect to local socket instance - for dev purposes.
            var socketHost = (window.location.origin.includes("localhost")) ? "http://localhost:4432"  : ""
                socket = io.connect(socketHost+"/home");
            gSockets.push(socket);
            // Only request cards if the path is root and no search pattern is present
            if((window.location.pathname === "/" || window.location.pathname === "index.html")){
                console.log("Laying cards");
                socket.on('lay-card',function(card){
                    Self.layCard(card);
                });
                socket.emit('cards','req');
            } else if(window.location.pathname.split('/').length === 2) {
                console.log("Send request for scripts");
                socket.on('lay-script', function(data){
                      Self.layScript(data);                               
                });
                socket.on("update-script",function(sn,ud){
                    console.log("Updating script details");
                    Self.updateScript(sn,ud);
                });
                socket.emit('script',null,window.location.pathname.split('/')[1]);
            }
            else {
                console.log("Laying error");
                requirejs(['text!/404_err_static.html'],function(data){
                    $('.main-body').append(data);
                });
            }
            socket.on('msg',function(msg){
                console.log(msg);
            });
        },
        navigate: function(link,fullpage){
            var Self = this;
            if(fullpage){ window.location.href = link; }
            else {
                // Disconnect sockets
                for(var i=0; i < gSockets.length; i++){
                    gSockets[i].disconnect();
                }
                UpdateQueryString("p",link,window.location.pathname);
                Self.loadPage();
            }
        },
        layScript_retire: function(script){
            var socket = $.grep(gSockets, function(e){ return e.nsp === "/home"; }),
                crd = $(script),
                pg = $('.main-body').append($("<div class='center-er'>").append(crd));
                socket.on('script-refresh', function(update,n){
                    $('#'+update).html(n);
                });
                crd.on('click',function(e){
                    socket.emit('script',$(e.target).attr('id'));
                });
        },
        layCard: function(card){
            var crd = $(card);
                pg = $('.main-body').append($("<div class='center-er'>").append(crd));
                crd.on('click',function(e){
                    if($(e.currentTarget).attr("open-new") == "false"){ window.location.href = $(e.currentTarget).attr("href"); }
                    else { window.open($(e.currentTarget).attr("href")); }
                });
        },
        updateScript: function(script,ud){
            if(ud.hasOwnProperty("last-run")){ $("#"+script).find(".script-last-run").html(ud["last-run"]); }
            if(ud.hasOwnProperty("status")){ $("#"+script).find(".script-status-result").html(ud.status); }
            if(ud.hasOwnProperty("test")){
                if(ud.test.hasOwnProperty("status")){ $("#"+script).find(".script-test-result").html(ud.test.status); }
                if(ud.test.status.includes("fail") || ud.test.status == false){ $("#"+script).find(".script-test-result").css("color","red"); }
                if(ud.test.hasOwnProperty("last-run")){ $("#"+script).find(".script-test-run").html(ud.test["last-run"]); }
            }            
        },
        layScript: function(script){
             require(['text!./templates/script-card-template.html'],function(temp){
                         var template = $(temp);                             
                         template.attr("id",script.name);
                         template.find(".script-title").html(script.title);
                         template.find(".script-note").html(script.note);
                         template.find(".script-last-run").html(script["last-run"]);
                         template.find(".script-test-result").html(script.status);
                         template.on('click',function(e){
                                        //$(e.currentTarget).find(".script-test-result").html("Running...");
                                        var socket = $.grep(gSockets, function(e){ return e.nsp === "/home"; })[0];
                                        socket.emit('run-script', e.currentTarget.id);
                                    });
                         $('.main-body').append($("<div class='center-er'>").append(template));
                    });
        }
    }
});