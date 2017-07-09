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
loadCSS('/style/results.css');

define(['socketio','moment'],function(io,moment){
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
        console.log("res");
        var row = $("<tr></tr>")
            date = $("<td class='result-time'>"+moment(data.date).format("MM/DD/YYYY hh:mm:ss A")+"</td>"),
            msg = $("<td class='result-message'>"+data.data+"</td>");
            row.append(date).append(msg);
            window.scrollTo(0,document.body.scrollHeight);
        $('#insert-here').append(row);
    });
    socket.emit('results-connect',getParameterByName("script"));
});
