/// <reference path="typings/node/node.d.ts"/>
var path = require('path');

module.exports = function(grunt) {
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        // Output path for "built" assets
        builtPath: __dirname + '/core/built',
        
        // Set by the set_configuration task
        currentConfiguration: {},
        
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
        
        // Custom task for specifying configuration
        set_configuration: {
            dev: {
                environmentName: 'dev'
            },
            release: {
                environmentName: 'cloud'
            }
        },
        
        // Copy files to the correct locations
        copy: {
            // Copy config files
            config: {
                nonull: true,
                files: [
                    { src: 'config/default.json5', dest: '<%= builtPath %>/config/default.json5' },
                    { src: 'config/<%= currentConfiguration.environmentName %>.json5', dest: '<%= builtPath %>/config/local.json5' }
                ]
            },
            
            // Copy SSL certs
            certs: {
                nonull: true,
                files: [
                    { src: 'certs/<%= currentConfiguration.environmentName %>.key.pem', dest: '<%= builtPath %>/certs/key.pem' },
                    { src: 'certs/<%= currentConfiguration.environmentName %>.cert.pem', dest: '<%= builtPath %>/certs/cert.pem' }
                ]
            },
            
            // Copy bower assets that aren't covered by bower_concat
            bower_assets: {
                files: [
                    { expand: true, cwd: 'bower_components/font-awesome/fonts/', src: '*', dest: '<%= builtPath %>/public/fonts/' }
                ]
            }
            // TODO: Copy build output for packaging?
        },
        
        // Concatenate bower dependencies
        bower_concat: {
            all: {
                dest: '<%= builtPath %>/public/js/bower.js',
                cssDest: '<%= builtPath %>/public/css/bower.css',
                mainFiles: {
                    bootstrap: [
                        // Can go back to default theme by removing bootswatch and bringing these back
                        // 'dist/css/bootstrap.css', 
                        // 'dist/css/bootstrap-theme.css', 
                        'dist/js/bootstrap.js' 
                    ],
                    bootswatch: [
                        'cosmo/bootstrap.css'
                    ]
                }
            }
        },
        
        // Launch an express server
        express: {
            options: { 
                script: 'index.js',
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
                files: [ 'core/server/**/*.js', 'core/built/config/*.*' ],
                tasks: [ 'express:dev' ],
                options: {
                    spawn: false
                }
            },
            
            // Watch for changes to configs and re-copy
            configs: {
                files: [ 'config/*.json5' ],
                tasks: [ 'set_configuration:dev', 'copy:config' ]
            },
                        
            // Enable live reload on changes
            livereload: {
                files: [ 'core/public/**/*.*', 'core/built/public/**/*.*', 'core/server/views/**/*.jade' ],
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
        
    grunt.registerMultiTask('set_configuration', 'Sets some configuration values', function() {
        grunt.config.set('currentConfiguration', this.data);
    });
    
    grunt.registerTask('bower_assets', 'Generates bower assets', 
        [ 'bower_concat:all', 'copy:bower_assets' ]);
        
    grunt.registerTask('default', 'Build assets for development', 
        [ 'set_configuration:dev', 'bower_assets', 'copy:config', 'copy:certs' ]);
    
    grunt.registerTask('dev', 'Dev mode: watches files and restarts server on changes', 
        [ 'default', 'express:dev', 'watch' ]);
    
    // TODO: Release task for packaging (and deploying?)
};