process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Set the location for configuration files for the node-config module
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || __dirname + '/built/config';

var server = require('./server');

module.exports = function createAdminProxy() {
    return server({
        certPath: __dirname + '/built/certs',
        publicAssetPaths: [ 
            __dirname + '/public',
            __dirname + '/built/public'
        ]
    });
};