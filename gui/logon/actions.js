define(['/logon/server_actions.js','text!/logon/register.html','/js/lib/is.min.js'], function (server,regTemp){
    var regPerm = regTemp;  
    regTemp = $(regPerm);
    return {
        bind: function(){
            var self = this;
            $("#login").on('click',function(){
                var credentials = {
                    username: $('#username').val(),
                    password: $('#password').val()
                };
                alert("Login pressed");
            });
            $("#register").on('click',function(){
                var credentials = {
                    username: $('#username').val(),
                    password: $('#password').val()
                };
                self.registerForm(credentials);
            });
        },
        login: function(creds, cb) {
            
            
        }, 
        registerForm: function(creds) {
            var self = this;
            if(creds.username){ $(regTemp).find("#name").val(creds.username); }
            if(creds.password){ $(regTemp).find("#password").val(creds.password); }
            var dialog = $(regTemp).dialog({
                autoOpen: false,
                height: 450,
                width: 350,
                modal: true,
                buttons: {
                    "Register": { 
                        text: "Register",
                        id: "StartRegister",
                        click: function(){                            
                            self.register({
                                username: dialog.find('#name').val(),
                                password: dialog.find('#password').val(),
                                vpassword: dialog.find('#val_password').val(),
                                email: dialog.find('#email').val()
                            },function(res){
                                if(res === true){
                                    dialog.dialog("close");
                                    dialog.find('form').off('keydown');
                                }
                                else {
                                    $('#reg-err-msg').html(res);
                                }
                            });
                        }
                    },
                    "Cancel": function(){ dialog.dialog('close'); }
                },
                close: function(){ $('#reg-err-msg').empty(); }
            });
            dialog.find('form').on('keydown', function (e) {
				if (e.which == 13) { e.preventDefault(); $('#StartRegister').click(); }
			});
            $(dialog).tooltip();
            dialog.dialog('open');            
        },
        register: function(creds, cb){
            var validateRegister = function(creds){
                credsG=creds;
                if(creds.username.length < 6 || creds.username === "undefined" || creds.username === null){ return "Please enter a valid username, hover over the field for rules"; }
                if(!is.email(creds.email)){ return "Please enter a valid email address"; }
                if(creds.password.length < 6 || creds.password === "undefined" || creds.password === null){ return "Please enter a valid password, hover over the field for rules" }
                if(creds.password !== creds.vpassword){ return "Password and verify password don't match, please double check the password" }
                return true;
            },
            valid = validateRegister(creds);
            if(valid !== true){
                cb(valid);
            }
            else {
                server.register(creds,function(res){
                    console.log("Returned from server function");
                    console.log(res);
                    cb(res);
                });
            }
        }
    }
});


    