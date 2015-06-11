var LRU = require('lru-cache');

// A session store implementation that uses a LRU cache for storage
module.exports = function(session) {
    // Express' session store
    var Store = session.Store;
    
    // Initialize the cache store with the given options
    function LruCacheStore(cacheSize) {
        Store.call(this);
        
        // Max number of sessions at once
        this.cache = LRU(cacheSize);
    }
    
    // Inherit from store
    LruCacheStore.prototype.__proto__ = Store.prototype;
    
    // Try to get a session by session id
    LruCacheStore.prototype.get = function(sid, callback) {
        var store = this;
        
        var sess = getSession.call(store, sid);
        callback && setImmediate(callback, null, sess);
    };
    
    // Set the session data by session id
    LruCacheStore.prototype.set = function(sid, sess, callback) {
        var store = this;
        
        store.cache.set(sid, JSON.stringify(sess));
        callback && setImmediate(callback);
    };
    
    // Destory the session associated with the session id
    LruCacheStore.prototype.destory = function(sid, callback) {
        var store = this;
        
        store.cache.del(sid);
        callback && setImmediate(callback);
    };
    
    // Refresh the TTL for the given session
    LruCacheStore.prototype.touch = function(sid, sess, callback) {
        var store = this;
        
        // Update expiration
        var currentSession = getSession.call(store, sid);
        if (currentSession) {
            currentSession.cookie = sess.cookie;
            store.cache.set(sid, JSON.stringify(currentSession));
        }
        
        callback && setImmediate(callback);
    };
    
    // Get the number of sessions (this will include stale items)
    LruCacheStore.prototype.length = function(callback) {
        var store = this;
        
        var count = store.cache.itemCount();
        callback && setImmediate(callback, null, count);
    };
    
    // Reset/clear the cache of session data
    LruCacheStore.prototype.clear = function(callback) {
        var store = this;
        
        store.cache.reset();
        callback && setImmediate(callback);
    };
    
    // Gets the session from the cache, deleting any expired sessions
    function getSession(sid) {
        var sess = this.cache.get(sid);
        if (!sess) {
            return;
        }
        
        sess = JSON.parse(sess);
        
        // Check if expired
        var expires = typeof sess.cookie.expires === 'string'
            ? new Date(sess.cookie.expires)
            : sess.cookie.expires;
        
        if (expires && expires <= Date.now()) {
            this.cache.del(sid);
            return;
        }
        
        return sess;
    }
    
    return LruCacheStore;
};