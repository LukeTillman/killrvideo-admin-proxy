var express = require('express');

// Return an express app that redirects http traffic to https
module.exports = function redirectApp() {
    var app = express();
    
    app.use(function(req, res) {
        res.redirect(301, 'https://' + req.get('host') + req.originalUrl);
    });
    
    return app;
};