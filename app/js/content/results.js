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
define(['socketio'],function(io){
    var getParameterByName = function(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        },
        socketHost = (window.location.origin.includes("localhost")) ? "http://localhost:4432"  : ""
        socket = io.connect(socketHost+"/results");
    socket.on('results',function(data){
        $('#results').html('<p>'+data+'</p>');
    });
    socket.emit('results-connect',getParameterByName("script"))
});
