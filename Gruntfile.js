module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    jade: {
      translate: {
        options: {
          data: {
            debug: false,
            files: {
              'tmp/html/all.html': ['views/**/*.jade']

            }
          }
        }
      }
    },

    nggettext_extract: {
      pot: {
        files: {
          'lang/po/template.pot': ['tmp/html/all.html', 'public/js/controllers/**/*.js']
        }
      }
    },

    nggettext_compile: {
      all: {
        files: {
          'public/js/lang/translations.js': ['lang/po/*.po']
        }
      }
    }
  })

  grunt.registerTask('translate', ['jade:translate', 'nggettext_extract', 'nggettext_compile'])
  grunt.registerTask('default', ['translate'])
}
