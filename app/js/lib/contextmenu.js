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

var cardActions = {
    newCard: function(event, ui){
        require(['text!/js/lib/templates/add-scriptgroup-template.html'],function(data){
            var verifyNewCard = function(obj){       
                if(obj.name == null || obj.name =="" || obj.name == "undefined"){ return "Name field cannot be blank. Please fill it in."; }
                if(obj.access.length < 1){ return "At least one access group must be specified. Otherwise no one will be able to access this group!"; }
                if(obj.note == null || obj.note == "" || obj.note == "undefined"){ return "Please put a brief description of the purpose of this script group in the note field."; }
                return true;
            }
            var socket = $.grep(gSockets, function(e){ return e.nsp === "/home"; })[0];
            loadCSS('/style/dialog-form.css');
            data = $(data);
            socket.emit('groups');
            socket.on('groups',function(data){
                $('#add-group').autocomplete({
                    source: data,
                    minLength: 0
                });
                $('#add-group').on('click',function(){
                    $('#add-group').autocomplete( "search", "" );
                });
            });
            $(data).find('#selected-groups').selectable({

            });
            $(data).find('#add-group-button').on('click',function(e){
                var tarVal = $('#add-group').val();
                if(tarVal !== null && tarVal !== 'undefined' && tarVal !== ""){
                    $('<li>'+tarVal.toLowerCase()+'</li>').appendTo('#selected-groups');
                    $('#add-group').val(null);
                    
                }
            });
            $(data).find('#remove-group').on('click',function(e){
                $('.ui-selected').each(function(a,obj){
                    $(obj).remove();
                });
            });
            var dialog = $(data).dialog({
                autoOpen: true,
                height: 450,
                width: 620,
                modal: true,
                buttons: {
                    "Add": { 
                        text: "Add",
                        id: "Add-ScriptGroup",
                        click: function(){
                            $('#err-msg').empty();                          
                            var dataz = {
                                name: $('#name').val(),
                                access: function(){ a = new Array(); $('#selected-groups li').each(function(o,obj){ a.push(obj.innerText); }); return a; }(),
                                note: "<h3>" + $('#title').val() + "</h3>" + $('#note').val(),
                                createdBy: muser.username
                            }
                            var ver = verifyNewCard(dataz);
                            if(ver === true){
                                socket.off('addScriptGroup');
                                socket.on('addScriptGroup',function(res){
                                    if(res==="Succesfully added ScriptGroup"){
                                        dialog.dialog('close');
                                    } else {
                                        $('#err-msg').html(res);
                                    }
                                });
                                socket.emit('addScriptGroup',dataz);
                            }
                            else { $('#err-msg').html(ver); }
                        }
                    },
                    "Cancel": function(){ dialog.dialog('close'); }
                },
                close: function(){ $('#err-msg').empty(); }
            });
        });
    },
    deleteCard: function(event, ui){        
       if (ui.target.hasClass('page-tile')) {
			var tar = $(ui.target);
		} else {
			var tar = $(ui.target).parents('.page-tile');
        }
        var socket = $.grep(gSockets, function(e){ return e.nsp === "/home"; })[0];
        socket.emit('removeScriptGroup',tar.attr('id'));
        tar.parent().remove();
    }
}

var scriptContext = [
    {title: "Run", action: scriptActions.runScript},
    {title: "View Last Results", action: scriptActions.viewScriptResults},
    {title: "---"},
    {title: "View Error Log", action: scriptActions.viewScriptLogs},
]

var groupContext = [
    {title: "New Group", cmd: "new", action: cardActions.newCard},
    {title: "Delete Group", cmd: "delete", action: cardActions.deleteCard},
]

var contextMenu = {
    delegate: ".script-tile, .page-tile, .ScriptGroups ",
    trigger: "left",
    autoFocus: true,
    preventContextMenuForPopup: true,
    preventSelect: true,
    taphold: true,
    menu: [],
    beforeOpen: function(event,ui){
        if($(event.currentTarget).hasClass("script-tile")){ 
            $(document).contextmenu("replaceMenu",scriptContext);
            return;
        }
        if($(event.currentTarget).hasClass("ScriptGroups")){
            
            $(document).contextmenu("replaceMenu",groupContext);
            if($(ui.target).hasClass("page-tile") || $(ui.target).parent('.page-tile')[0] ){ $(document).contextmenu("enableEntry","delete",true); }
            else { $(document).contextmenu("enableEntry","delete",false); }
            return;
        }
        else { return; }
    }

}


return {
    init: function(){
        if(muser){
            $(document).contextmenu(contextMenu);
        }
    }
}

});