define(['/js/lib/jquery-ui/jquery.ui-contextmenu.min.js'],function(){
var scriptActions = {
    runScript: function(event, ui){
        if (ui.target.hasClass('script-tile')) {
			var tar = $(ui.target)
		} else {
			var tar = $(ui.target).parents('.script-tile');
		}
        console.log(ui.target);
        var socket = $.grep(gSockets, function(e){ return e.nsp === "/home"; })[0];
        socket.emit('run-script', $(tar).attr('id'),muser);
        console.log('Running...');
    },
    viewScriptResults: function(event,ui){
        
    },
    viewScriptLogs: function(event,ui){

    }
}

var scriptContext = [
    {title: "Run", action: scriptActions.runScript},
    {title: "View Last Results", action: scriptActions.viewScriptResults},
    {title: "---"},
    {title: "View Error Log", action: scriptActions.viewScriptLogs},
]

var contextMenu = {
    delegate: ".script-tile",
    trigger: "left-click",
    autoFocus: true,
    preventContextMenuForPopup: true,
    preventSelect: true,
    taphold: true,
    menu: [],
    beforeOpen: function(event,ui){
        console.log("Trying.");
        if($(event.currentTarget).hasClass("script-tile")){ 
            $(document).contextmenu("replaceMenu",scriptContext);
            return;
        }
    }

}


return {
    init: function(){
        $(document).contextmenu(contextMenu);
    }
}

});