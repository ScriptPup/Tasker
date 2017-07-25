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
console.log("Schedules");
loadCSS('/style/schedule.css');
define(['socketio','moment'],function(io,moment){

});