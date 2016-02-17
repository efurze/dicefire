// Here's a decent resource on Gruntfile.js:
// http://techblog.troyweb.com/index.php/2014/05/using-grunt-to-auto-restart-node-js-with-file-watchers/

module.exports = function(grunt) {

  grunt.initConfig({
    shell: {
      redis: {
        command: 'redis-server ./config/redis.conf'
      }
    },
		'node-inspector': {
        custom: {
            options: {
                'web-port': 1337,
                'web-host': 'localhost',
                'debug-port': 5858,
                'save-live-edit': true,
								'debug-brk' : true,
                'stack-trace-limit': 4
            }
        }
    },
    concurrent: {
      dev: [
        'watch',
        'node-inspector',
        'nodemon',
        'shell'
      ],
      options: {
      logConcurrentOutput: true
      }
    },
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['public/**/*.js', '!public/js/test.js', '!public/test/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      files: ['Gruntfile.js', 'public/**/*.js', 'test/**/*.js', 'index.js', 'controllers/**/*.js', 'lib/**/*.js'],
      options: {
        // options here to override JSHint defaults
        jshintrc: '.jshintrc'
      }
    },
    sass: {
      dist: {
        files: {
          'public/css/main.css': 'public/css/scss/main.scss',
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>', 'views/**/*.hbs', 'public/css/scss/*'],
      tasks: ['sass', 'concat', 'uglify']//['jshint', 'qunit']
    },
    nodemon: {
        dev: {
          options: {
            file: 'index.js',
            //nodeArgs: ['--debug-brk']
          }
        }
    },
  });

  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('node-inspector');
  grunt.loadNpmTasks('grunt-node-inspector');

  grunt.registerTask('test', ['jshint', 'qunit']);
  grunt.registerTask('default', ['sass', 'concat', 'uglify']); //, 'jshint', 'concat', 'uglify']);
  grunt.registerTask('small', ['concat', 'uglify']);
  grunt.registerTask('server', ['default', 'concurrent']);

};
