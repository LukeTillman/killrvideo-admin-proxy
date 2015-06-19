process.env.APP_ROOT_PATH = process.env.APP_ROOT_PATH || __dirname;

var adminProxy = require('./core');

// Create and start the server
adminProxy().then(function(server) {
    server.start();
}).catch(function(err) {
    console.log(err);
    process.exit(1);
});