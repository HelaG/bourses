'use strict';

var _ = require('lodash');
var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({
    mdph: req.user.mdph
  }, '-salt -hashedPassword', function (err, users) {
    if(err) return handleError(req, res, err);
    res.json(users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.unconfirmed = true;
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token });
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if(err) return handleError(req, res, err);
    if (user) {
      user.remove();
    }
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword') // don't ever give out the password or salt)
  .populate('mdph')
  .exec(function(err, user) {
    if (err) return next(err);
    if (!user) return res.json(401);
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

exports.resetPassword = function(req, res) {
  User.findById(req.params.id, '+newPasswordToken', function(err, user) {
    if (err) return handleError(req, res, err);
    if (!user) return res.sendStatus(404);
    if (!req.params.secret) return res.sendStatus(400);
    if (req.params.secret !== user.newPasswordToken) return res.sendStatus(400);
    user.password = req.body.newPassword;
    user.newPasswordToken = '';
    user.save(function(err) {
      if (err) return validationError(res, err);
      return res.sendStatus(200);
    })
  })
};

function handleError(req, res, err) {
  req.log.error(err);
  return res.status(500).send(err);
}
