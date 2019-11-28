var gulp = require('gulp')
var clean = require('gulp-clean')
var gap = require('gulp-append-prepend')
var buffer = require('vinyl-buffer')
var source = require('vinyl-source-stream')
var browserify = require('browserify')

var extractStrings = require('offen/localize/task.js')

var pkg = require('./package.json')

gulp.task('extract-strings', extractStrings(pkg.offen.locales))

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

gulp.task('default', gulp.series(
  'clean:pre',
  gulp.series(pkg.offen.locales.map(function (locale) {
    return createLocalizedBundle(locale)
  })),
  'clean:post'
))

function createLocalizedBundle (locale) {
  var dest = './dist/' + locale + '/'
  var scriptTask = makeScriptTask(dest, locale)
  scriptTask.displayName = 'script:' + locale

  return scriptTask
}

function makeScriptTask (dest, locale) {
  return function () {
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
      .plugin('tinyify')
      .bundle()
      .pipe(source('script.js'))
      .pipe(buffer())
      .pipe(gap.prependText('*/'))
      .pipe(gap.prependFile('./../banner.txt'))
      .pipe(gap.prependText('/**'))
      .pipe(gulp.dest(dest))
  }
}
