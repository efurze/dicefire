/*
var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');
*/

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = function(req, res, next) {
    /*
    var provider = req.params.provider;
    User.findById(req.user.id, function(err, user) {
        if (err) return next(err);

        user[provider] = undefined;
        user.tokens = _.reject(user.tokens, function(token) {
            return token.kind === provider;
        });

        user.save(function(err) {
            if (err) return next(err);
            req.flash('info', {
                msg: provider + ' account has been unlinked.'
            });
            res.redirect('/a');
        });
    });
*/
};
