define(['/js/lib/jquery-ui/jquery.ui-contextmenu.min.js','/js/lib/gui.js'],function(a,gui){
var scriptActions = {
    runScript: function(event, ui){
        if (ui.target.hasClass('script-tile')) {
			var tar = $(ui.target)
		} else {
			var tar = $(ui.target).parents('.script-tile');
		}
        var socket = $.grep(gSockets, function(e){ return e.nsp === "/home"; })[0];
        socket.emit('run-script', $(tar).attr('id'),muser);
        console.log('Running script '+ $(tar).attr('id'));
    },
    viewScriptResults: function(event,ui){
        if (ui.target.hasClass('script-tile')) {
			var tar = $(ui.target)
		} else {
			var tar = $(ui.target).parents('.script-tile');
		}
        gui.navigate("/results/?script="+$(tar).attr('id'),false,true);
    },
    viewScriptLogs: function(event,ui){
                if (ui.target.hasClass('script-tile')) {
			var tar = $(ui.target)
		} else {
			var tar = $(ui.target).parents('.script-tile');
		}
        gui.navigate("/logs/?script="+$(tar).attr('id'),false,true);
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
    trigger: "left",
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