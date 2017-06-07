requirejs.config({
    baseUrl: '/js/lib',
    paths: {
        text: '/js/lib/text'
    }
});
// Load CSS
requirejs(['/js/lib/is.min.js','/js/lib/loadCSS/loadCSS.js','/js/lib/loadCSS/onloadCSS.js','/js/lib/loadCSS/cssrelpreload.js'], function() {
    loadCSS("/style/fonts.css");
    loadCSS("/style/logon.css");
    loadCSS("/js/lib/jquery-ui/jquery-ui.min.css");
    if(is.mobile()){
        loadCSS('/style/phone.css');
    }    
    else if(is.tablet()){
        loadCSS('/style/tablet.css');
    }
});
// Load JS
requirejs(
    [   'jquery' // Standard jQuery library
        ,'/js/lib/jquery-ui/jquery-ui.min.js' // jQuery UI
        ,'/logon/actions.js' // Custom login actions
    ], function($,ui,actions) {
    $('.login-table').tooltip();
    requirejs(['/js/lib/load.js','/js/lib/gui.js'], function(load){
        load.page_loaded();
    });
    actions.bind();
});
    