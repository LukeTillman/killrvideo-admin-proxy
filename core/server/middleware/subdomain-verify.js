var config = require('config');
var _ = require('lodash');

// Index of all subdomains in the configuration by the subdomain property
var subdomainsIndex = _.indexBy(config.get('subdomains'), 'subdomain');

// Returns middleware the validates a subdomain is present on the request and that
// it is one of the proxied subdomains
module.exports = function subdomainVerify() {
    return function subdomainVerify(req, res, next) {
        // If no subdomain specified, that's an error
        if (req.subdomains.length !== 1) {
            next(new Error('No single subdomain present'));
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
        
        // Save the proxy information on the request and continue
        req.proxyTo = proxyTo;
        next();
    };
};