/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var fs = require('fs')
var gulp = require('gulp')
var clean = require('gulp-clean')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var rev = require('gulp-rev')
var buffer = require('vinyl-buffer')
var gap = require('gulp-append-prepend')
var Readable = require('stream').Readable

var pkg = require('./package.json')

var defaultLocale = 'en'
var linguas = fs.readFileSync('./locales/LINGUAS', 'utf-8')
  .split(' ')
  .filter(Boolean)
  .map(function (s) {
    return s.trim()
  })

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
  gulp.series.apply(gulp, [defaultLocale].concat(linguas).map(function (locale) {
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
    var transforms = JSON.parse(JSON.stringify(pkg.browserify.transform))
    var b = browserify({
      entries: './index.js',
      // See: https://github.com/nikku/karma-browserify/issues/130#issuecomment-120036815
      postFilter: function (id, file, currentPkg) {
        if (currentPkg && currentPkg.name === pkg.name) {
          currentPkg.browserify.transform = []
        }
        return true
      },
      transform: transforms.map(function (transform) {
        if (transform === '@offen/l10nify') {
          return ['@offen/l10nify', { locale: locale }]
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
      .add(configureDatepickerLocale(locale))
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
      .plugin('tinyify', { noFlat: true })
      .bundle()
      .pipe(source('vendor.js'))
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

// This function creates a module that registers the given locale with
// `react-datepicker`. Handling this at build time allows us to avoid including
// unused locales for non-English bundles. At development time, the default
// locale (en) will be included implicitly.
function configureDatepickerLocale (locale) {
  return Readable.from([`
const { registerLocale } = require('react-datepicker')
const locale = require('date-fns/locale/${locale}')

registerLocale('${locale}', locale)
  `])
}
