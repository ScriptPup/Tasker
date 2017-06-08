define(['/logon/server_actions.js','text!/logon/register.html','text!/logon/register_success.html','text!/logon/login_success.html','/js/lib/is.min.js'], function (server,regTemp,reg_success_template,login_success_template){
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
                self.login(credentials,function(res,creds){
                    if(!res){  
                        $(ls).find('#login-message').html(creds);
                        $(ls).dialog();                       
                    }
                    else { 
                        if (typeof(Storage) !== "undefined") {
                            var ls = $(login_success_template);
                            $(ls).find('#login-message').html("You logged in successfully, your user rights will be applied on all pages. Please close this dialog to continue.");
                            $(ls).dialog({close: function(){ window.location.href = "/"}});
                            localStorage.setItem("cred",JSON.stringify(creds));
                        } else {
                            alert("It looks like your browser doesn't support modern features. Please use an updated browser to login.");
                        }                        
                    }
                });
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
            server.login(creds,function(res,creds){
                cb(res,creds);
            });            
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
                                        var um = $(reg_success_template);
                                        $(um).find('#registration-message').html("User registration successful, you may now log in.");
                                        $(um).dialog();
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
                server.register(creds,function(res,msg){
                    cb(res);
                });
            }
        }
    }
});


    