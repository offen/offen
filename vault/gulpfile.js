var gulp = require('gulp')
var clean = require('gulp-clean')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var rev = require('gulp-rev')
var runSequence = require('run-sequence')
var buffer = require('vinyl-buffer')
var revReplace = require('gulp-rev-replace')
var sriHash = require('gulp-sri-hash')
var gap = require('gulp-append-prepend')

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
    .exclude('dexie')
    .exclude('ulid')
    .exclude('underscore')
    .exclude('date-fns')
    .exclude('unibabel')
    .plugin('tinyify')
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(gap.prependText('*/'))
    .pipe(gap.prependFile('./../banner.txt'))
    .pipe(gap.prependText('/**'))
    .pipe(rev())
    .pipe(gulp.dest('./dist/'))
    .pipe(rev.manifest('./dist/rev-manifest.json', { base: './dist', merge: true }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('bundle:vendor', function () {
  var b = browserify()

  return b
    .require('dexie')
    .require('ulid')
    .require('underscore')
    .require('date-fns')
    .require('unibabel')
    .plugin('tinyify')
    .bundle()
    .pipe(source('vendor.js'))
    .pipe(buffer())
    .pipe(gap.prependText('*/'))
    .pipe(gap.prependFile('./../banner.txt'))
    .pipe(gap.prependText('/**'))
    .pipe(rev())
    .pipe(gulp.dest('./dist/'))
    .pipe(rev.manifest('./dist/rev-manifest.json', { base: './dist', merge: true }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('revreplace', function () {
  return gulp.src('./index.html')
    .pipe(gap.prependText('-->'))
    .pipe(gap.prependFile('./../banner.txt'))
    .pipe(gap.prependText('<!--'))
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
