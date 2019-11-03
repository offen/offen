var gulp = require('gulp')
var clean = require('gulp-clean')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var uglify = require('gulp-uglify')
var rev = require('gulp-rev')
var buffer = require('vinyl-buffer')
var revReplace = require('gulp-rev-replace')
var sriHash = require('gulp-sri-hash')
var gap = require('gulp-append-prepend')

var pkg = require('./package.json')

gulp.task('clean:pre', function () {
  return gulp
    .src('./dist', { read: false, allowEmpty: true })
    .pipe(clean())
})

gulp.task('clean:post', function () {
  return gulp
    .src('./dist/**/*.json', { read: false, allowEmpty: true })
    .pipe(clean())
})

function makeScript (locale) {
  var task = function () {
    var b = browserify({
      entries: './index.js',
      transform: pkg.browserify.transform.map(function (transform) {
        if (transform === 'offen/localize') {
          return ['offen/localize', { locale: locale }]
        }
        return transform
      })
    })

    return b
      .exclude('plotly.js-basic-dist')
      .plugin('tinyify')
      .bundle()
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(gap.prependText('*/'))
      .pipe(gap.prependFile('./../banner.txt'))
      .pipe(gap.prependText('/**'))
      .pipe(rev())
      .pipe(gulp.dest('./dist/' + locale + '/'))
      .pipe(rev.manifest('./dist/' + locale + '/rev-manifest.json', { base: './dist/' + locale, merge: true }))
      .pipe(gulp.dest('./dist/' + locale))
  }
  task.displayName = 'script:' + locale
  return task
}

function makeVendor (locale) {
  var task = function () {
    var b = browserify()

    return b
      .require('plotly.js-basic-dist')
      .bundle()
      .pipe(source('vendor.js'))
      .pipe(buffer())
      // the `tinyify` plugin fails on mangling plotly for unknown reasons, so
      // it is being uglified instead: https://github.com/browserify/tinyify/issues/13
      .pipe(uglify())
      .pipe(gap.prependText('*/'))
      .pipe(gap.prependFile('./../banner.txt'))
      .pipe(gap.prependText('/**'))
      .pipe(rev())
      .pipe(gulp.dest('./dist/' + locale + '/'))
      .pipe(rev.manifest('./dist/' + locale + '/rev-manifest.json', { base: './dist/' + locale, merge: true }))
      .pipe(gulp.dest('./dist/' + locale))
  }
  task.displayName = 'vendor:' + locale
  return task
}

function makeRevReplace (locale) {
  var task = function () {
    return gulp.src('./index.html')
      .pipe(gap.prependText('-->'))
      .pipe(gap.prependFile('./../banner.txt'))
      .pipe(gap.prependText('<!--'))
      .pipe(revReplace({ manifest: gulp.src('./dist/' + locale + '/rev-manifest.json') }))
      .pipe(gulp.dest('./dist/' + locale + '/'))
      .pipe(sriHash({ relative: true, selector: 'script[src]' }))
      .pipe(gulp.dest('./dist/' + locale + '/'))
  }
  task.displayName = 'revreplace:' + locale
  return task
}

function createLocalizedBundle (locale) {
  return gulp.series(
    gulp.parallel(makeScript(locale), makeVendor(locale)),
    makeRevReplace(locale)
  )
}

gulp.task('default', gulp.series(
  'clean:pre',
  gulp.series.apply(gulp, ['en', 'de'].map(function (locale) {
    return createLocalizedBundle(locale)
  })),
  'clean:post'
))
