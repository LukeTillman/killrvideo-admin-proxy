var httpProxy = require('http-proxy');
var _ = require('lodash');
var logger = require('../lib/logger');
var config = require('../conf');

// Returns middleware that proxies requests to backend services
module.exports = function proxy() {
    var subdomainsIndex = _.indexBy(config.subdomains, 'subdomain');
    
    // Create a proxy server to service requests
    var p = httpProxy.createProxyServer({xfwd: true});
    
    return function proxy(req, res, next) {
        // Nothing to do if no subdomain
        if (req.subdomains.length !== 1) {
            next();
            return;
        }
        
        var subdomain = req.subdomains[0];
        logger.debug('Looking for proxied subdomain [%s]', subdomain);
        
        // Check with the index to see if its a valid subdomain
        var proxyTo = subdomainsIndex[subdomain];
        if (!proxyTo) {
            res.status(404).send('Invalid domain.');
            return;
        }
                
        logger.debug('Proxying request from [%s] to [%s]', req.hostname, proxyTo.upstream);
        
        // Proxy the request and handle errors
        p.web(req, res, { target: 'http://' + proxyTo.upstream }, function(err) {
            if (!err) return;
            logger.error(err, 'Problem talking to proxied service');
            next(err);
        });
    };
};