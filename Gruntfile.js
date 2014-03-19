module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    jade: {
      translate: {
        options: {
          data: {
            debug: false,
            files: {
              'tmp/html/all.html': ['res/app/**/*.jade']

            }
          }
        }
      }
    },

    'nggettext_extract': {
      pot: {
        files: {
          'res/lang/po/template.pot': ['tmp/html/all.html', 'res/app/**/*.js']
        }
      }
    },

    'nggettext_compile': {
      all: {
        files: {
          'res/lang/translations.js': ['res/lang/po/*.po']
        }
      }
    }
  })

  grunt.registerTask('translate', [
    'jade:translate'
  , 'nggettext_extract'
  , 'nggettext_compile'
  ])
  grunt.registerTask('default', ['translate'])
}
