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
define(['socketio'], function(io) {
    var socketHost = (window.location.origin.includes("localhost")) ? "http://localhost:4432"  : "",
        socket = io.connect(socketHost+"/auth");

    return {
        register: function(creds, cb){
            socket.off('register-resp');
            socket.on('register-resp',function(res,msg){
                var send = (res===true) ? true : msg;
                if(cb){ cb(send); }
            });
            socket.emit('register',creds);
        },
        login: function(creds, cb){
            socket.off('login-resp');
            socket.on('login-resp',function(res,usr){
                if(cb){ cb(res,usr); }
            });           
            socket.emit('login', creds);
        }
    }
});