var path = require('path');

module.exports = function(grunt) {
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        // Shell tasks
        shell: {
            // Run Bower install to get all client-side assets
            bower: {
                command: __dirname + '/node_modules/.bin/bower --allow-root install',
                options: {
                    stdout: true,
                    stdin: false
                }
            }
        },
        
        // Copy files to the correct locations
        copy: {
            dev: {
                files: [
                    { src: 'conf.local.js', dest: 'conf.js' }
                ]
            },
            
            release: {
                files: [
                    // TODO: Rest of build output to ./build directory
                    { src: 'conf.cloud.js', dest: 'conf.js' }
                ]
            }
        },
        
        // Concatenate bower dependencies
        bower_concat: {
            all: {
                dest: __dirname + '/public/js/bower.js',
                cssDest: __dirname + '/public/css/bower.css'
            }
        },
        
        // Launch an express server
        express: {
            options: { 
                script: 'app.js',
                output: '.+Listening on.+',
                debug: true
            },
            dev: {
                options: {}
            }
        },
        
        // Watch for file changes and kick off tasks
        watch: {
            // Watch for changes to the server code and reload express
            express: {
                files: [ '**/*.js', '!public/js/*.js' ],
                tasks: [ 'express:dev' ],
                options: {
                    spawn: false
                }
            },
            
            // Concat files if bower dependencies change
            bower_concat: {
                files: [ 'bower.json' ],
                tasks: [ 'bower_concat:all' ]
            },
            
            // Enable live reload on changes to public assets
            livereload: {
                files: [ 'public/**/*.*', 'views/**/*.jade' ],
                options: {
                    livereload: true
                }
            }
        }
    });
    
    // Load all NPM tasks
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    // Custom tasks
    grunt.registerTask('init', 'Prepare the project for development', 
        [ 'shell:bower', 'default' ]);
    
    grunt.registerTask('default', 'Build assets for development', 
        [ 'bower_concat:all', 'copy:dev' ]);
    
    grunt.registerTask('dev', 'Dev mode: watches files and restarts server on changes', 
        [ 'default', 'express:dev', 'watch' ]);
    
    // TODO: Release task for packaging (and deploying?)
};