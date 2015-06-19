var expressSession = require('express-session');
var LruCacheStore = require('../lib/lru-cache-store')(expressSession);
var config = require('config');

// Use shared storage across all instances of session middleware (max of 50 sessions stored)
var sharedStore = new LruCacheStore(50);

// Returns middleware for storing/accessing sessions
module.exports = function session() {
    // Return default express session middleware instance with some settings
    return expressSession({
        store: sharedStore,
        name: '__killrvideoproxy',
        // Cookies should use the root domain so subdomains can share sessions
        cookie: { domain: '.' + config.get('domain') },
        resave: false,
        saveUninitialized: false,
        secret: config.get('cookieSecret')
    });
};