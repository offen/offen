/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var gulp = require('gulp')
var clean = require('gulp-clean')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var uglify = require('gulp-uglify')
var rev = require('gulp-rev')
var buffer = require('vinyl-buffer')
var gap = require('gulp-append-prepend')

var extractStrings = require('offen/localize/task.js')

var pkg = require('./package.json')

gulp.task('extract-strings', extractStrings(pkg.offen.locales))

gulp.task('clean:pre', function () {
  return gulp
    .src('./dist', { read: false, allowEmpty: true })
    .pipe(clean())
})

gulp.task('default', gulp.series(
  'clean:pre',
  // it is important to run the localized bundles in series so that
  // browserify is always sure which locale to use in the transform
  // configuration
  gulp.series.apply(gulp, pkg.offen.locales.map(function (locale) {
    return createLocalizedBundle(locale)
  }))
))

function createLocalizedBundle (locale) {
  var dest = './dist/' + locale + '/auditorium/'
  var scriptTask = makeScriptTask(dest, locale)
  scriptTask.displayName = 'script:' + locale
  var vendorTask = makeVendorTask(dest)
  vendorTask.displayName = 'vendor:' + locale
  return gulp.parallel(scriptTask, vendorTask)
}

function makeScriptTask (dest, locale) {
  return function () {
    var b = browserify({
      entries: './index.js',
      transform: pkg.browserify.transform.map(function (transform) {
        if (transform === 'offen/localize') {
          return ['offen/localize', { locale: locale }]
        }
        if (Array.isArray(transform) && transform[0] === 'envify') {
          return ['envify', { LOCALE: locale }]
        }
        return transform
      })
    })
      .transform('aliasify', { global: true })

    return b
      .exclude('plotly.js-basic-dist')
      .exclude('zxcvbn')
      .plugin('tinyify')
      .bundle()
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(gap.prependText('*/'))
      .pipe(gap.prependFile('./../banner.txt'))
      .pipe(gap.prependText('/**'))
      .pipe(rev())
      .pipe(gulp.dest(dest))
      .pipe(rev.manifest(dest + '/rev-manifest.json', { base: dest, merge: true }))
      .pipe(gulp.dest(dest))
  }
}

function makeVendorTask (dest) {
  return function () {
    var b = browserify()
    return b
      .require('plotly.js-basic-dist')
      .require('zxcvbn')
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
      .pipe(gulp.dest(dest))
      .pipe(rev.manifest(dest + '/rev-manifest.json', { base: dest, merge: true }))
      .pipe(gulp.dest(dest))
  }
}
