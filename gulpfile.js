var gulp     = require("gulp");
var babel    = require("gulp-babel");
require('babel-core/register');
gulp.task("default", function () {
  return gulp.src("src/**/**.js")
    .pipe(babel())
    .pipe(gulp.dest("dist"));
});
