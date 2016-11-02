const path = require('path');
const packageJson = require('../package.json');

module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-coffeelint-cjsx');
  grunt.loadNpmTasks('grunt-lesslint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-less');

  // This allows all subsequent paths to the relative to the root of the repo
  const appDir = path.resolve('..');
  grunt.file.setBase(appDir);
  grunt.option('appDir', appDir);

  grunt.loadTasks('./build/tasks');

  const COFFEE_SRC = [
    'internal_packages/**/*.cjsx',
    'internal_packages/**/*.coffee',
    'dot-nylas/**/*.coffee',
    'src/**/*.coffee',
    'src/**/*.cjsx',
    'spec/**/*.cjsx',
    'spec/**/*.coffee',
    '!src/**/node_modules/**/*.coffee',
    '!internal_packages/**/node_modules/**/*.coffee',
  ];

  const ES_SRC = [
    'internal_packages/**/*.jsx',
    'internal_packages/**/*.es6',
    'internal_packages/**/*.es',
    'dot-nylas/**/*.es6',
    'dot-nylas/**/*.es',
    'src/**/*.es6',
    'src/**/*.es',
    'src/**/*.jsx',
    'spec/**/*.es6',
    'spec/**/*.es',
    'spec/**/*.jsx',
    '!src/**/node_modules/**/*.es6',
    '!src/**/node_modules/**/*.es',
    '!src/**/node_modules/**/*.jsx',
    '!internal_packages/**/node_modules/**/*.es6',
    '!internal_packages/**/node_modules/**/*.es',
    '!internal_packages/**/node_modules/**/*.jsx',
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    less: {
      options: {
        paths: [
          'static/variables',
          'static',
        ],
      },
      glob_to_multiple: {
        expand: true,
        src: [
          'static/**/*.less',
        ],
        dest: appDir,
        ext: '.css',
      },
    },

    nylaslint: {
      src: COFFEE_SRC.concat(ES_SRC),
    },

    coffeelint: {
      'options': {
        configFile: 'build/config/coffeelint.json',
      },
      'src': COFFEE_SRC,
      'build': [
        'build/tasks/**/*.coffee',
        'build/Gruntfile.js',
      ],
      'test': [
        'spec/**/*.cjsx',
        'spec/**/*.coffee',
      ],
      'static': [
        'static/**/*.coffee',
        'static/**/*.cjsx',
      ],
      'target': (grunt.option("target") ? grunt.option("target").split(" ") : []),
    },

    eslint: {
      options: {
        ignore: false,
        configFile: 'build/config/eslint.json',
      },
      target: ES_SRC,
    },

    eslintFixer: {
      src: ES_SRC,
    },

    csslint: {
      options: {
        'adjoining-classes': false,
        'duplicate-background-images': false,
        'box-model': false,
        'box-sizing': false,
        'bulletproof-font-face': false,
        'compatible-vendor-prefixes': false,
        'display-property-grouping': false,
        'fallback-colors': false,
        'font-sizes': false,
        'gradients': false,
        'ids': false,
        'important': false,
        'known-properties': false,
        'outline-none': false,
        'overqualified-elements': false,
        'qualified-headings': false,
        'unique-headings': false,
        'universal-selector': false,
        'vendor-prefix': false,
        'duplicate-properties': false, // doesn't place nice with mixins
      },
      src: [
        'static/**/*.css',
      ],
    },

    lesslint: {
      src: [
        'internal_packages/**/*.less',
        'dot-nylas/**/*.less',
        'static/**/*.less',
      ],
      options: {
        imports: ['variables/*.less'],
      },
    },

    package: {

    },
  });

  // Register Lint Tasks
  grunt.registerTask('lint', ['eslint', 'lesslint', 'nylaslint', 'coffeelint', 'csslint']);

  // Register Build Tasks
  grunt.registerTask('build', ['packager']);


  // Register CI Tasks
  const {shouldPublishBuild} = require('./tasks/task-helpers')(grunt);
  const ciTasks = ['build'];
  if (shouldPublishBuild()) {
    ciTasks.push('publish-nylas-build');
  }

  return grunt.registerTask('ci', ciTasks);
}
