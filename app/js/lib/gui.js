requirejs.config({
    shim: {
        "socketio": {
            exports: 'io'
        }
    },
    paths: {
        socketio: '/js/lib/socket.io/dist/socket.io.slim',
        moment: '/js/lib/moment'
    }
});
define(['socketio','moment'], function(io,moment){
    // User logged in? If so, make it obvious!
    if(typeof muser !== 'undefined'){ if(muser){ $('#loginer').html("<a href='/logon/index.html'>Welcome, "+muser.username+"</a>"); } }
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
            socket.on('verify-fail',function(){
                muser = null;
                localStorage.removeItem('cred');
                $('.login-link a').html("Login/Register");
            });
            // Only request cards if the path is root and no search pattern is present
            if((window.location.pathname === "/" || window.location.pathname === "index.html")){
                $('.main-body').addClass("ScriptGroups");
                socket.on('lay-card',function(card){
                    Self.layCard(card);
                });
                socket.emit('cards',muser);
            } else if(window.location.pathname.split('/').length === 2) {
                $('.main-body').addClass("Scripts");
                socket.on('lay-script', function(data){
                      Self.layScript(data);                                                   
                });
                socket.on("update-script",function(sn,ud){
                    Self.updateScript(sn,ud);
                });
                socket.emit('script',muser,window.location.pathname.split('/')[1]);
            }
            else if(window.location.pathname.split('/').length === 3){                
                require(['text!/content/'+window.location.pathname.split('/')[1]+".html"],function(data){
                    if(data){
                        var h = (document.body.scrollHeight*0.78);
                        $('.main-body').append(data);
                        $('.center-er, .page-content').css('min-height',h);                 
                    }
                    else {
                        requirejs(['text!/404_err_static.html'],function(data){
                            $('.main-body').append(data);
                        });
                    }
                });
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
        navigate: function(link,fullpage,npage){
            var Self = this;
            if(fullpage){ window.location.href = link; }
            else if(npage){ window.open(link, '_blank') }
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
                    if(update && n){
                        $('#'+update).html(n);
                    }                    
                });
                /*
                crd.on('click',function(e){

                    //socket.emit('script',$(e.target).attr('id'));
                });
                */
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
            if(ud.hasOwnProperty("last-run")){ $("#"+script).find(".script-last-run").html(moment(ud["last-run"]).format("MM/DD/YYYY hh:mm:ss A")); }
            if(ud.hasOwnProperty("status")){ $("#"+script).find(".script-status-result").html(ud.status); }
            if(ud.hasOwnProperty("test")){
                if(ud.test.hasOwnProperty("status")){ $("#"+script).find(".script-test-result").html(ud.test.status); }
                if(ud.test.hasOwnProperty("status")){
                    if(ud.test.status.includes("fail") || ud.test.status == false){ $("#"+script).find(".script-test-result").css("color","red"); }
                }
                if(ud.test.hasOwnProperty("last-run")){ $("#"+script).find(".script-test-run").html(ud.test["last-run"]); }
            }            
        },
        layScript: function(script){
             require(['text!./templates/script-card-template.html'],function(temp){
                         var template = $(temp);                             
                         template.attr("id",script.name);
                         template.attr("group",script.group);
                         template.find(".script-title").html(script.title);
                         template.find(".script-note").html(script.note);
                         template.find(".script-last-run").html(moment(script["last-run"]).format("MM/DD/YYYY hh:mm:ss A"));
                         template.find(".script-test-result").html(script.status);
                         template.on('click',function(e){
                            $(document).contextmenu('open',$(e.target));
                         });
                        if(!$('.center-er')[0]){
                            $('.main-body').append($("<div class='center-er'>").append(template));
                        } else {
                            $('.center-er').append(template);
                        }
                         socket.emit('update-script',script.name);  
                    });
        }        
    }
});