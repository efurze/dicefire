var crypto = require('crypto');
// Redis
var redis = require('redis');
var redisClient = redis.createClient(); //6379, 'localhost', '');


var User = function(data) {
    var self = this;

    if (data) {
        Object.keys(data).forEach(function(key) {
            self[key] = data[key];
        });
    }

};


User.findById = function(id, callback) {
    redisClient.get("user-" + id, function(err, data) {
        if (!data || err) {
            callback(err);
        } else {
            // This can exception technically.
            callback(new User(JSON.parse(data)));
        }
    });
};

User.findOne = function(data, callback) {
    return this.findById(data.facebook, callback);
};

User.prototype.save = function(callback) {
    redisClient.set("user-" + this.facebook, JSON.stringify(this), function(err, reply) {
        callback(err);
    });
};



module.exports = User;
