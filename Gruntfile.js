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
        
        // Custom task for specifying configuration
        build: {
            dev: {
                configFile: 'conf.local.js'
            },
            release: {
                configFile: 'conf.cloud.js'
            }
        },
        
        // Copy files to the correct locations
        copy: {
            config: {
                src: '<%= build.current.configFile %>',
                dest: 'conf.js'
            },
            
            assets: {
                files: [
                    { expand: true, cwd: 'bower_components/font-awesome/fonts/', src: '*', dest: 'public/fonts/' }
                ]
            }
            // TODO: Copy build output for packaging?
        },
        
        // Concatenate bower dependencies
        bower_concat: {
            all: {
                dest: __dirname + '/public/js/bower.js',
                cssDest: __dirname + '/public/css/bower.css',
                mainFiles: {
                    bootstrap: [ 
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
                files: [ '**/*.js', '!public/js/*.js', '!Gruntfile.js' ],
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
    
    grunt.registerMultiTask('build', 'Builds assets for development or release', function() {
        grunt.config.set('build.current', this.data);
        
        // Build is just an alias for other tasks once configuration has been set
        grunt.task.run([ 'bower_concat:all', 'copy:config', 'copy:assets' ]);
    });
    
    grunt.registerTask('default', 'Build assets for development', [ 'build:dev' ]);
    
    grunt.registerTask('dev', 'Dev mode: watches files and restarts server on changes', 
        [ 'default', 'express:dev', 'watch' ]);
    
    // TODO: Release task for packaging (and deploying?)
};