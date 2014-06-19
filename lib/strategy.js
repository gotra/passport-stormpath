'use strict';


var stormpath = require('stormpath');

var helpers = require('./helpers');


/**
 * Stormpath passport strategy constructor.
 *
 * The Stormpath authentication strategy authenticates requests using
 * Stormpath's API service (https://www.stormpath.com).
 *
 * @class Strategy
 * @constructor
 *
 * @param {Object} [options] - Stormpath configuration options.
 * @param {String} options.apiKeyId - Your Stormpath API key ID.  Defaults to `process.env['STORMPATH_API_KEY_ID']`.
 * @param {String} options.apiKeySecret - Your Stormpath API key secret.  Defaults to `process.env['STORMPATH_API_KEY_SECRET']`.
 * @param {String} options.appHref - Your Stormpath Application href.  Defaults to `process.env['STORMPATH_APPLICATION_HREF']`.
 * @param {String} options.usernameField - The HTML form field to retrieve the username from.  Defaults to `'username'`.
 * @param {String} options.passwordField - The HTML form field to retrieve the password from.  Defaults to `'password'`.
 *
 * @example
 *      // This assumes you've defined:
 *      //
 *      // - STORMPATH_API_KEY_ID
 *      // - STORMPATH_API_KEY_SECRET
 *      // - STORMPATH_APPLICATION_HREF
 *      //
 *      // As environment variables.
 *      passport.use(new StormpathStrategy());
 *
 * @example
 *      // This assumes you're setting each option manually.
 *      passport.use(new StormpathStrategy({
 *        apiKeyId:         process.env['STORMPATH_API_KEY_ID'],
 *        apiKeySecret:     process.env['STORMPATH_API_KEY_SECRET'],
 *        appHref:          process.env['STORMPATH_APPLICATION_HREF'],
 *        usernameField:    'username_or_email',
 *        passwordField:    'password'
 *      });
 *
 */
function Strategy(o) {
  var opts = o || {};

  this._usernameField = opts.usernameField || 'username';
  this._passwordField = opts.passwordField || 'password';

  var apiKeyId = opts.apiKeyId || process.env['STORMPATH_API_KEY_ID'] || '';
  var apiKeySecret = opts.apiKeySecret || process.env['STORMPATH_API_KEY_SECRET'] || '';
  var appHref = opts.appHref || process.env['STORMPATH_APP_HREF'] || '';

  var self = this;

  if (opts.spClient) {
    self.spClient = opts.spClient;
  } else {
    self.spClient = new stormpath.Client({
      apiKey: new stormpath.ApiKey(apiKeyId,apiKeySecret)
    });
  }

  if (opts.spApp) {
    self.spApp = opts.spApp;
  } else {
    self.spClient.getApplication(appHref, function(err, app) {
      self.spApp = app;
      if (err) {
        throw err;
      }
    });
  }

  self.serializeUser = function(user, done) {
    done(null, user.href);
  };

  self.deserializeUser = function(userHref, done) {
    self.spClient.getAccount(userHref, function(err,account) {
      done(err, account);
    });
  };

  return this;
}


/**
 * Specify the passport strategy name.
 *
 * @property
 */
Strategy.prototype.name = 'stormpath';


/**
 * Authenticate a Stormpath user.
 *
 * @method authenticate
 * @param {Object} req - The HTTP request object.
 * @param {Object} [options] - Stormpath authentication options.
 * @return {Object} - Returns the Stormpath account object on success.
 *
 * Options:
 *  - `badRequestMessage`   The human readable error message to display to the user if the request was invalid.  Defaults to 'Missing credentials.'.
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};

  var self = this;
  var username = helpers.lookup(req.body, this._usernameField) || helpers.lookup(req.query, this._usernameField);
  var password = helpers.lookup(req.body, this._passwordField) || helpers.lookup(req.query, this._passwordField);
  var data = {
    username: username,
    password: password
  };

  if (!username || !password) {
    return self.fail({ message: options.badRequestMessage || 'Missing credentials' }, 400);
  }

  self.spApp.authenticateAccount(data, function(err, result) {
    if (err) {
      return self.fail({ message: err.userMessage }, 400);
    } else {
      self.success(result.account);
    }
  });
};


/**
 * Expose `StormpathStrategy`.
 *
 * @property
 */
module.exports = Strategy;
