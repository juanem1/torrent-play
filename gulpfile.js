var gulp = require('gulp-param')(require('gulp'), process.argv);
var exec = require('gulp-exec');
var builder = require('gulp-nw-builder');
var clean = require('gulp-clean');
var runSequence = require('run-sequence');
var fs = require('fs');
var _ = require('lodash');

/**
 * Available platforms:
 * win32, win64, osx32, osx64, linux32, linux64
 * @type {string[]}
 */
var BUILD_PLATFORMS = ['osx64'];
var BUILD_VERSION   = 'v0.12.2';


/**
 * Start task
 * By default will start osx64
 * Run: gulp start --platform linux64
 */
gulp.task('start', function(platform) {

    // Start path for all OS's
    var paths = {
        osx32:   'build/torrentPlay/osx32/torrentPlay.app/Contents/MacOS/nwjs .',
        osx64:   'build/torrentPlay/osx64/torrentPlay.app/Contents/MacOS/nwjs .',
        win32:   'build/torrentPlay/win32/torrentPlay.exe .',
        win64:   'build/torrentPlay/win64/torrentPlay.exe .',
        linux32: 'build/torrentPlay/linux32/torrentPlay .',
        linux64: 'build/torrentPlay/linux64/torrentPlay .'
    };

    // Default start path
    var platformPath = paths.osx64;

    var options = {
        // default = false, true means don't emit error event
        continueOnError: false,

        // default = false, true means stdout is written to file.contents
        pipeStdout: false,

        // content passed to gutil.template()
        customTemplatingThing: 'test'
    };

    var reportOptions = {
        // default = true, false means don't write err
        err: true,

        // default = true, false means don't write stderr
        stderr: true,

        // default = true, false means don't write stdout
        stdout: true
    };

    if (platform) {
        switch (platform) {
            case 'osx32':
                platformPath = paths.osx32;
                break;

            case 'win32':
                platformPath = paths.win32;
                break;

            case 'win64':
                platformPath = paths.win64;
                break;

            case 'linux32':
                platformPath = paths.linux32;
                break;

            case 'linux64':
                platformPath = paths.linux64;
                break;

            default:
                platformPath = paths.osx64;
                break;
        }
    }

    gulp.src('./src')
        .pipe(exec(platformPath, options))
        .pipe(exec.reporter(reportOptions));
});

/**
 * Build task
 * Run: gulp build
 */
gulp.task('build', function() {
    runSequence(
        'build:clean',
        'generate-source-package-json',
        'build:make',
        'build-copy-node-modules'
    );
});


/**********************************************************************
 * PRIVATE TASKS
 *********************************************************************/

/**
 * Remove old build folder before build
 */
gulp.task('build:clean', function() {
    return gulp.src('./build', {read: false}).pipe(clean());
});

/**
 * Generate a new build folder
 */
gulp.task('build:make', function() {
    return gulp.src([
        './src/**/*'
    ]).pipe(
        builder({
            version: BUILD_VERSION,
            platforms: BUILD_PLATFORMS
        })
    );
});

/**
 * Copy node modules to the build directory
 */
gulp.task('build-copy-node-modules', function() {

    var nm = './node_modules/';
    var packageDefinition = require('./package.json');
    var modules = _.keysIn(packageDefinition.dependencies);

    var destinations = {
        osx32: 'build/torrentPlay/osx32/torrentPlay.app/Contents/Resources/app.nw/node_modules/',
        osx64: 'build/torrentPlay/osx64/torrentPlay.app/Contents/Resources/app.nw/node_modules/',
        win32: 'build/torrentPlay/win32/node_modules/',
        win64: 'build/torrentPlay/win64/node_modules/',
        linux32: 'build/torrentPlay/linux32/node_modules/',
        linux64: 'build/torrentPlay/linux64/node_modules/'
    };

    for (var p = 0, len0 = BUILD_PLATFORMS.length; p < len0; p++) {
        for (var z = 0, len2 = modules.length; z < len2; z++) {
            gulp.src(nm + modules[z] + '/**/*').pipe(gulp.dest(destinations[BUILD_PLATFORMS[p]] + modules[z]));
        }
    }
});

/**
 * Remove ./src/package.json
 */
gulp.task('remove-old-package-definition', function() {
    return gulp.src('./src/package.json', {read: false}).pipe(clean());
});

/**
 * Create dynamically package.json to generate the build.
 */
gulp.task('generate-source-package-json', ['remove-old-package-definition'], function() {

    // I use some definitions from the main package.json
    var packageDefinition = require('./package.json');

    // Content for the file
    var content = {
        name: packageDefinition.name,
        version: packageDefinition.version,
        main: 'index.html',
        dependencies: {}
    };

    // Convert Object to json string
    var json = JSON.stringify(content, null, 2);

    fs.writeFile('./src/package.json', json, function(err) {
        if (err) throw err;
    });

    // I need to return a gulp instance to not break the chain
    return gulp.src('./src', {read: false});
});