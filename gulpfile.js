
var gulp = require('gulp'),
    webserver = require('gulp-webserver'),
    sass = require('gulp-sass'),
    jshint = require('gulp-jshint'),
    sourcemaps = require('gulp-sourcemaps'),
    spritesmith = require('gulp.spritesmith'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util');

var CacheBuster = require('gulp-cachebust');
var cachebust = new CacheBuster();

/////////////////////////////////////////////////////////////////////////////////////
//
// runs bower to install frontend dependencies
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('bower', function() {

    var install = require("gulp-install");

    return gulp.src(['./bower.json'])
        .pipe(install());
});


/////////////////////////////////////////////////////////////////////////////////////
//
// runs sass, creates css source maps
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build-css', ['bower'], function() {
    return gulp.src('./styles/*')
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(cachebust.resources())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./dist'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// fills in the Angular template cache, to prevent loading html templates via multiple
// separate http requests
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build-template-cache',  function() {
    
    var ngHtml2Js = require("gulp-ng-html2js"),
        concat = require("gulp-concat");
    
    return gulp.src("./ngv/partials/*.html")
        .pipe(ngHtml2Js({
            moduleName: "ngvPartials",
            prefix: "/ngv/partials/"
        }))
        .pipe(concat("templateCachePartials.js"))
        .pipe(gulp.dest("./dist"));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// runs jshint
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('jshint', function() {
    gulp.src('/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// Build a minified Javascript bundle
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build-js', function() {
    var b = browserify({
        entries: './js/app.js',
        debug: true,
        paths: ['/js/**']
    });

    return b.bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(cachebust.resources())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/js/'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// full build (except sprites), applies cache busting to the main page css references
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('build', ['bower','build-css','build-template-cache', 'jshint', 'build-js'], function() {
    return gulp.src('showcase.html')
        .pipe(cachebust.references())
        .pipe(gulp.dest('dist'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// watches the main file types, and triggers a build when a modification is detected
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('watch', function() {
    gulp.watch(['./**/*.html', './styles/**/*.*css', './js/**/*.js'], ['build']);
});

/////////////////////////////////////////////////////////////////////////////////////
//
// launches a web server that serves files in the current directory
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('webserver', function() {
    gulp.src('.')
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
            open: "http://localhost:8000/dist/index.html"
        }));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// launch a build upon modification and publish it to a running server
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('dev', ['watch', 'webserver']);

/////////////////////////////////////////////////////////////////////////////////////
//
// generates a sprite png and the corresponding sass sprite map.
// This is not included in the recurring development build and needs to be run separately
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('sprite', function () {

    var spriteData = gulp.src('./ngv/images/sprite/*.png')
        .pipe(spritesmith({
            imgName: 'todo-sprite.png',
            cssName: '_todo-sprite.scss',
            algorithm: 'top-down',
            padding: 5
        }));

    spriteData.css.pipe(gulp.dest('./dist'));
    spriteData.img.pipe(gulp.dest('./dist'))
});

/////////////////////////////////////////////////////////////////////////////////////
//
// installs and builds everything, including sprites
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('default', ['sprite','build']);