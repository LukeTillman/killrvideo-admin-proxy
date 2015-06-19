var util = require('util');
var OAuth2Strategy = require('passport-oauth2');
var InternalOAuthError = require('passport-oauth2').InternalOAuthError;

// A custom GitHub authentication strategy for Passport
function GitHubStrategy(options, verify) {
    options.authorizationURL = 'https://github.com/login/oauth/authorize';
    options.tokenURL = 'https://github.com/login/oauth/access_token';
    options.scopeSeparator = ',';
    options.customHeaders = {};
    options.customHeaders['User-Agent'] = 'passport-github';
    
    // Call oauth constructor
    OAuth2Strategy.call(this, options, verify);
    
    this.name = 'github';
}

// Inherit from OAuth2Strategy
util.inherits(GitHubStrategy, OAuth2Strategy);

// Method for getting the user profile
GitHubStrategy.prototype.userProfile = function(accessToken, done) {
    var self = this;
    
    this._oauth2.get('https://api.github.com/user', accessToken, function (err, body, res) {
        var profile;
        
        if (err) {
            return done(new InternalOAuthError('Failed to fetch user profile', err));
        }
    
        // Don't do any normalization, just parse the JSON returned
        try {
            profile = JSON.parse(body);
        } catch (ex) {
            return done(new Error('Failed to parse user profile'));
        }
        
        // Get orgs the user belongs to
        self._oauth2.get('https://api.github.com/user/orgs', accessToken, function(err, body, res) {
            if (err) {
                return done(new InternalOAuthError('Failed to fetch user orgs', err));
            }
          
            try {
                profile.orgs = JSON.parse(body);
            } catch (ex) {
                return done(new Error('Failed to parse user orgs'));
            }
            
            // Everything is golden
            done(null, profile);
        });
    });
};

// Export the strategy
module.exports = GitHubStrategy;
module.exports.Strategy = GitHubStrategy;