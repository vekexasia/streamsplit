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
