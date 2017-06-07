muser = (localStorage.getItem("cred")) ? JSON.parse(localStorage.getItem("cred")) : null;
gSockets = [];
requirejs.config({
    baseUrl: '/js/lib',
    shim: {
        "socketio": {
            exports: 'io'
        },
        "underscore": {
            exports: '_'
        }
    },
    paths: {
        text: '/js/lib/text',
        socketio: '/js/lib/socket.io/dist/socket.io.slim',
        underscore: '/js/lib/underscore',
        ip: '/js/lib/ip'
    }
});
// Load CSS
requirejs(['/js/lib/loadCSS/loadCSS.js','/js/lib/loadCSS/onloadCSS.js','/js/lib/loadCSS/cssrelpreload.js'], function() {
    loadCSS("/style/fonts.css");
    loadCSS("/style/main.css");
    loadCSS("/js/lib/jquery-ui/jquery-ui.min.css");
});

// Load JS
requirejs(
    [   'jquery' // Standard jQuery library
        ,'/js/lib/jquery-ui/jquery-ui.min.js' // jQuery UI
    ], 
    function($,ui) {
        requirejs(['/js/lib/load.js'], function(load){
            load.page_loaded();
        });
        require(
            ['/js/lib/gui.js'],function(gui){
                gui.loadPage();
            });
    });