
const packager = require('electron-packager');
const path = require('path');
const tmpdir = path.resolve(require('os').tmpdir(), 'nylas-build');
const fs = require('fs-plus');
const compile = require('electron-compile');

module.exports = (grunt) => {
  function runResolveSymlinks(buildPath, electronVersion, platform, arch, callback) {
    console.log(" -- Moving symlinked node modules / internal packages into build folder.")

    const dirs = [
      path.join(buildPath, 'internal_packages'),
      path.join(buildPath, 'node_modules'),
    ];

    dirs.forEach((dir) => {
      fs.readdirSync(dir).forEach((packageName) => {
        const packagePath = path.join(dir, packageName)
        const realPackagePath = fs.realpathSync(packagePath).replace('/private/', '/')
        if (realPackagePath !== packagePath) {
          console.log(`Copying ${realPackagePath} to ${packagePath}`);
          fs.removeSync(packagePath);
          fs.copySync(realPackagePath, packagePath);
        }
      });
    });

    callback();
  }

  function runElectronCompile(buildPath, electronVersion, platform, arch, callback) {
    console.log(" -- Running electron-compile. For extended debug info, run with DEBUG=electron-compile:*")

    const cachePath = path.join(buildPath, '.cache');
    try {
      fs.mkdirSync(cachePath);
    } catch (err) {
      //
    }

    const host = compile.createCompilerHostFromProjectRootSync(buildPath, cachePath)

    host.compileAll(buildPath, (filepath) => {
      const relativePath = filepath.replace(buildPath).replace('undefined/', '/');
      if (filepath.endsWith('.less')) {
        return false;
      }
      return relativePath.startsWith('/src') || relativePath.startsWith('/internal_packages');
    })
    .then(() => {
      host.saveConfiguration().then(callback)
    })
    .catch((err) => {
      console.error(err);
    });
  }

  const opts = {
    'dir': grunt.option('appDir'),
    'tmpdir': tmpdir,
    'app-copyright': 'Copyright 2014-2016 Nylas',
    'derefSymlinks': false,
    'asar': false,
    // {
    //   'unpack': "{" + [
    //     '*.node',
    //     '**/vendor/**',
    //     'examples/**',
    //     '**/src/tasks/**',
    //     '**/node_modules/spellchecker/**',
    //     '**/node_modules/windows-shortcuts/**',
    //   ].join(',') + "}",
    // },
    'icon': path.resolve(grunt.option('appDir'), 'build', 'resources', 'mac', 'nylas.icns'),
    'ignore': [
      '\\.DS_Store$',
      '^/apm',
      '^/arclib',
      '^/build',
      '/docs/',
      '/gh-pages/',
      '^/flow-typed',
      '^/src/pro',
      '^/spec_integration',
      '\\.jshintrc$',
      '\\.npmignore$',
      '\\.pairs$',
      '\\.travis\\.yml$',
      'appveyor\\.yml$',
      '\\.idea$',
      '\\.editorconfig$',
      '\\.lint$',
      '\\.lintignore$',
      '\\.arcconfig$',
      '\\.flowconfig$',
      '\\.jshintignore$',
      '\\.gitattributes$',
      '\\.gitkeep$',
      '\\.pdb$',
      '\\.cc$',
      '\\.h$',
      'binding\\.gyp$',
      'target\\.mk$',
      '\\.node\\.dYSM$',
      '@paulbetts[\\/]+cld[\\/]+deps[\\/]+cld',
    ],
    'out': path.resolve(grunt.option('appDir'), 'dist'),
    'overwrite': true,
    'prune': true,
    'extend-info': path.resolve(grunt.option('appDir'), 'build', 'resources', 'mac', 'nylas-Info.plist'),
    'extra-resource': [
      path.resolve(grunt.option('appDir'), 'build', 'resources', 'mac', 'Nylas Calendar.app'),
    ],

    'afterCopy': [
      runResolveSymlinks,
      runElectronCompile,
    ],
  }

  grunt.registerTask('packager', 'Package build of N1', function pack() {
    const done = this.async()

    console.log('----- Running build with options:');
    console.log(JSON.stringify(opts, null, 2));

    packager(opts, (err, appPaths) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`Done: ${appPaths}`);
      done();
    });
  });
};
