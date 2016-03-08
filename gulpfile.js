var gulp     = require("gulp");
var babel    = require("gulp-babel");
var istanbul = require('gulp-istanbul');
var isparta  = require('isparta');
var mocha    = require('gulp-mocha');
require('babel-core/register');
gulp.task("default", function () {
  return gulp.src("src/**/**.js")
    .pipe(babel())
    .pipe(gulp.dest("dist"));
});


gulp.task('pre-test', function () {
  return gulp.src(['./src/**/*.js'])
    .pipe(istanbul({
      instrumenter   : isparta.Instrumenter,
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function (cb) {
  return gulp.src(['./test/**/*.spec.js'])
    .pipe(mocha({
      reporter: 'list',
      bail    : true,
      //grep: 'toBuffer'
    }))
    .on('error', function (err) {
      console.log('ERROR');
      console.log(err.stack);
      console.log(err.message);
      cb();
    })
    .pipe(istanbul.writeReports({
      dir       : './coverage',
      reportOpts: { dir: './coverage' },
      reporters : ['html']
    }))
});

gulp.task('watch-test', function () {
  gulp.watch(['./test/**/*.js', './src/**/*.js'], ['test']);
});