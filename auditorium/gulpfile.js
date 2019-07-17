var gulp = require('gulp')
var clean = require('gulp-clean')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var uglify = require('gulp-uglify')
var rev = require('gulp-rev')
var runSequence = require('run-sequence')
var buffer = require('vinyl-buffer')
var revReplace = require('gulp-rev-replace')
var sriHash = require('gulp-sri-hash')

gulp.task('clean:pre', function () {
  return gulp
    .src('./dist', { read: false })
    .pipe(clean())
})

gulp.task('clean:post', function () {
  return gulp
    .src('./dist/*.json', { read: false })
    .pipe(clean())
})

gulp.task('bundle:script', function () {
  var b = browserify({
    entries: './index.js'
  })

  return b
    .exclude('plotly.js-basic-dist')
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(rev())
    .pipe(gulp.dest('./dist/'))
    .pipe(rev.manifest('./dist/rev-manifest.json', { base: './dist', merge: true }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('bundle:vendor', function () {
  var b = browserify()

  return b
    .require('plotly.js-basic-dist')
    .bundle()
    .pipe(source('vendor.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(rev())
    .pipe(gulp.dest('./dist/'))
    .pipe(rev.manifest('./dist/rev-manifest.json', { base: './dist', merge: true }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('revreplace', function () {
  return gulp.src('./template.html')
    .pipe(revReplace({ manifest: gulp.src('./dist/rev-manifest.json') }))
    .pipe(gulp.dest('./dist/'))
    .pipe(sriHash({ relative: true }))
    .pipe(gulp.dest('./dist/'))
})

gulp.task('default', function () {
  return runSequence(
    'clean:pre',
    ['bundle:script', 'bundle:vendor'],
    'revreplace',
    'clean:post'
  )
})
