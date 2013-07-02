//Export module
var chat = module.exports;
    

//Require modules
var users = require('./users');
    

chat.getUser = function(req, res) {
    var username = "";
    
    var room = "";
    for (var user1 in GLOBAL.globalChatUsers){
        if (GLOBAL.globalChatUsers[user1].username == req.params.username){
            room = GLOBAL.globalChatUsers[user1].room;
        }
    }
    for (var user2 in GLOBAL.globalChatUsers){
        if (GLOBAL.globalChatUsers[user2].room == room && GLOBAL.globalChatUsers[user2].username != req.params.username){
            username = GLOBAL.globalChatUsers[user2].username;
        }
    }
    
    var fields = {
            username: 1,
            name: 1,
            avatar: 1,
            email: 1,
            gender: 1,
            birth: 1,
            description: 1
        };
    
    return users.getByUsername(username, fields, function(error, user) {
        var _user;
        if (error !== null) {
            //return errors.handle(error, res);
            console.log(JSON.stringify(error));
        } else if (user !== null) {
            _user = user.toObject();
            res.statusCode = 200;
            return res.end(JSON.stringify(_user));
        } else {
            res.statusCode = 404;
            return res.end();
        }
    });
};