var httpProxy = require('http-proxy');
var _ = require('lodash');
var logger = require('../lib/logger');
var config = require('config');

// Returns middleware that proxies requests to backend services
module.exports = function proxy() {
    var subdomainsIndex = _.indexBy(config.get('subdomains'), 'subdomain');
    
    // Create a proxy server to service requests
    var p = httpProxy.createProxyServer({xfwd: true});
    
    return function proxy(req, res, next) {
        // Nothing to do if no subdomain
        if (req.subdomains.length !== 1) {
            next();
            return;
        }
        
        var subdomain = req.subdomains[0];
        
        // Check with the index to see if its a valid subdomain
        var proxyTo = subdomainsIndex[subdomain];
        if (!proxyTo) {
            var invalidDomain = new Error('Invalid Domain');
            invalidDomain.status = 404;
            next(invalidDomain);
            return;
        }
        
        // If the request is for the root, make sure we shouldn't redirect
        if (req.path === '/' && proxyTo.redirectOnRoot) {
            res.redirect(proxyTo.redirectOnRoot);
            return;
        }
        
        // Proxy the request and handle errors
        p.web(req, res, { target: 'http://' + proxyTo.upstream }, function(err) {
            if (!err) return;
            next(err);
        });
    };
};