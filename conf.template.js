module.exports = {
    // Whether or not we're in a development environment
    isDevelopment: true,
    
    // Where to bind the server
    bindPort: 80,
    bindIp: '127.0.0.1',
    
    // The main domain
    domain: 'killrvideo-cassandra1.localhost.net',
    
    // Secret used to sign cookies
    cookieSecret: 'some secret',
    
    // Subdomains being proxied
    subdomains: [
        { subdomain: 'solr', upstream: 'localhost:18983' },
        { subdomain: 'opscenter', upstream: 'localhost:8888' }
    ],
    
    // How to authenticate users
    authentication: {
        // The path to the login page
        loginPath: '/auth/login',
        
        // Authentication method configuration
        google: {
            appId: 'APP_ID_HERE',
            appSecret: 'APP_SECRET HERE'
        },
        
        github: {
            appId: 'APP_ID_HERE',
            appSecret: 'APP_SECRET_HERE'
        }
    } 
};