// Returns middleware that redirects on requests to the root if configured for that
// subdomain
module.exports = function subdomainRedirectRoot() {
    return function subdomainRedirectRoot(req, res, next) {
        // If proxyTo request information isn't present, something's wrong
        if (!req.proxyTo) {
            next(new Error('No proxy information found on the request'));
            return;
        }
        
        // If the request is for the root, see if we should redirect
        if (req.path === '/' && req.proxyTo.redirectOnRoot) {
            res.redirect(req.proxyTo.redirectOnRoot);
            return;
        }
        
        // Otherwise nothing to do
        next();
    };
};