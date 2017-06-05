define([], function() {

    return {
        register: function(creds, cb){
            var res = 'Failed';

            if(cb){ cb(res); }
        },
        login: function(creds, cb){
            var res = true;

            if(cb){ cb(res); }
        }
    }
});