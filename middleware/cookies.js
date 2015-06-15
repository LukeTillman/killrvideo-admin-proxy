var cookieParser = require('cookie-parser');
var config = require('config');

// Returns middleware that enables parsing cookies
module.exports = function cookies() {
    return cookieParser(config.get('cookieSecret'));
};