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
    },
    addScript: function(event, ui){
        require(['text!/js/lib/templates/add-script-template.html'],function(data){
            var verifyNew = function(obj){       
                if(obj.name == null || obj.name =="" || obj.name == "undefined"){ return "Name field cannot be blank. Please fill it in."; }
                if(obj.path == null || obj.path =="" || obj.path == "undefined"){ return "Path field cannot be blank. Please fill it in."; }
                if(obj.title == null || obj.title =="" || obj.title == "undefined"){ return "Title field cannot be blank. Please fill it in."; }
                if(obj.access.length < 1){ return "At least one access group must be specified. Otherwise no one will be able to access this group!"; }
                if(obj.note == null || obj.note == "" || obj.note == "undefined"){ return "Please put a brief description of the purpose of this script group in the note field."; }
                return true;
            }
            var socket = $.grep(gSockets, function(e){ return e.nsp === "/home"; })[0];
            loadCSS('/style/dialog-form.css');
            data = $(data);
            socket.off('scriptTypes');
            socket.on('scriptTypes',function(data){
                if(data.hasOwnProperty("mod")){
                    eval(data.mod);
                }
                for(var i=0; i < data.types.length; i++){
                     $('#type').append($("<option value='"+data.types[i]+"'>"+data.types[i]+"</option>"));
                }
            });
            socket.off("groups");
            socket.on('groups',function(data){
                $('#add-group').autocomplete({
                    source: data,
                    minLength: 0
                });
                $('#add-group').on('click',function(){
                    $('#add-group').autocomplete( "search", "" );
                });
            });
            socket.emit('scriptgroups');
            socket.emit('groups');
            socket.emit('scriptTypes');
            
            $(data).find('#selected-groups').selectable({});
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
                height: 535,
                width: 620,
                modal: true,
                buttons: {
                    "Next": {
                        text: "Next",
                        id: "ScriptNext",
                        click: function(){
                            $('#err-msg').empty();                          
                            var dataz = {
                                name: $('#name').val(),
                                path: $('#path').val(),
                                args: $('#args').val(),
                                access: function(){ a = new Array(); $('#selected-groups li').each(function(o,obj){ a.push(obj.innerText); }); return a; }(),
                                run: $('#type option:selected').val(),
                                title: $('#title').val(),
                                note: $('#note').val(),
                                group: window.location.pathname.split('/')[1],
                                createdBy: muser.username
                            }
                            var ver = verifyNew(dataz);
                            if(ver === true){
                                dialog.dialog('destroy').remove();
                                scriptActions.addTest(dataz,function(dataz2){
                                    socket.off('addScript');
                                    socket.on('addScript',function(res){
                                        if(res===true){
                                            dialog.dialog('destroy').remove();
                                        } else {
                                            window.alert(res);
                                        }
                                    });                                
                                    socket.emit('addScript',dataz2,muser);
                                });
                            }
                            else { $('#err-msg-script').html(ver); }
                        }
                    },
                    "Cancel": function(){ dialog.dialog('destroy').remove(); }
                },
                close: function(){ $('#err-msg').empty(); }
            });
        });

    },
    addTest: function(datafull,cb){        
        require(['text!/js/lib/templates/add-scripttest-template.html'],function(data){
            var once = false;
            var verifyNew = function(obj){    
                console.log(obj);   
                if(obj.path == null || obj.path =="" || obj.path == "undefined"){ console.log("No path"); return false; }
                if(obj.args == null || obj.args =="" || obj.args == "undefined"){ console.log("No args"); return false; }
                return true;
            }
            loadCSS('/style/dialog-form.css');
            data = $(data);
            socket.off("groups");
            socket.on('groups',function(data){
                $('#add-group').autocomplete({
                    source: data,
                    minLength: 0
                });
                $('#add-group').on('click',function(){
                    $('#add-group').autocomplete( "search", "" );
                });
            });
            socket.off('scriptTypes');
            socket.on('scriptTypes',function(data){   
                for(var i=0; i < data.types.length; i++){
                    if(data.hasOwnProperty("mods")){
                        if(data.mods.hasOwnProperty(data.types[i])){
                            $('#type').append($("<option id='"+data.types[i]+"' value='"+data.types[i]+"'>"+data.types[i]+"</option>").attr("mod",data.mods[data.types[i]]));
                        }
                        else {
                            $('#type').append($("<option id='"+data.types[i]+"' value='"+data.types[i]+"'>"+data.types[i]+"</option>"));
                        }
                    }
                    else {
                        $('#type').append($("<option id='"+data.types[i]+"' value='"+data.types[i]+"'>"+data.types[i]+"</option>"));
                    }                    
                }
                $('#type').on('change',function(){
                    var doThis = $('#type :selected').attr('mod');
                    $('#addScript').find('input').each(function(){
                        $(this).attr('disabled',false);
                        if(($(this).attr('id') != "path") && ($(this).attr('id') != "args") && ($(this).attr('id') != "type")){
                            $(this).parent().parent().remove();
                        }
                    });
                    if(doThis){
                        eval(doThis);
                    }
                });                
            });
            socket.emit('scriptgroups');
            socket.emit('scriptTypes');
            socket.emit('groups');
            
            $(data).find('#selected-groups').selectable({});
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
                height: 500,
                width: 620,
                modal: true,
                buttons: {
                    "Add": { 
                        text: "Add Script",
                        id: "Add-ScriptGroup",
                        click: function(){
                            $('#err-msg-test').empty();                          
                            var dataz = {
                                path: $('#path').val(),
                                args: $('#args').val(),
                                run: $('#type option:selected').val(),
                            }
                            var ver = verifyNew(dataz); 
                            if(ver != true && once === false) 
                                { 
                                    once = true; 
                                    $('#err-msg-test').html("You haven't filled out all of the test script fields. Without a test, Tasker will not be able to report success properly. If you are sure, press add again."); 
                                }
                            else {
                                dialog.dialog('destroy').remove();
                                datafull.test = dataz;
                                cb(datafull);
                            }
                        }
                    },
                    "Cancel": function(){ dialog.dialog('destroy').remove(); }
                },
                close: function(){ $('#err-msg-test').empty(); }
            });
        });

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
    {title: "New Script", cmd: "new", action: scriptActions.addScript},
    {title: "---"},
    {title: "Run", cmd: "run", action: scriptActions.runScript},
    {title: "View Last Results", cmd: "viewr", action: scriptActions.viewScriptResults},
    {title: "---"},
    {title: "View Error Log", cmd: "viewe", action: scriptActions.viewScriptLogs},
]

var groupContext = [
    {title: "New Group", cmd: "new", action: cardActions.newCard},
    {title: "Delete Group", cmd: "delete", action: cardActions.deleteCard},
]

var contextMenu = {
    delegate: ".script-tile, .page-tile, .ScriptGroups, .Scripts",
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
        if($(event.currentTarget).hasClass("Scripts")){      
            $(document).contextmenu("replaceMenu",scriptContext);
            if($(ui.target).hasClass("script-tile") || $(ui.target).parent('.script-tile')[0] ){ 
                $(document).contextmenu("enableEntry","run",true);
                $(document).contextmenu("enableEntry","viewr",true); 
                $(document).contextmenu("enableEntry","viewe",true); 
            
            }
            else {
                 $(document).contextmenu("enableEntry","run",false);
                $(document).contextmenu("enableEntry","viewr",false); 
                $(document).contextmenu("enableEntry","viewe",false); 

            }
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