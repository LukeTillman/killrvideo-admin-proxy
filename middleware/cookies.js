var cookieParser = require('cookie-parser');
var config = require('../conf');

// Returns middleware that enables parsing cookies
module.exports = function cookies() {
    return cookieParser(config.cookieSecret);
};