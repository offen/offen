/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs')
const gulp = require('gulp')
const clean = require('gulp-clean')
const gap = require('gulp-append-prepend')
const buffer = require('vinyl-buffer')
const source = require('vinyl-source-stream')
const browserify = require('browserify')

const pkg = require('./package.json')

const defaultLocale = 'en'
const linguas = fs.readFileSync('./locales/LINGUAS', 'utf-8')
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

gulp.task('clean:post', function () {
  return gulp
    .src('./dist/**/*.json', { read: false, allowEmpty: true })
    .pipe(clean())
})

gulp.task('default', gulp.series(
  'clean:pre',
  gulp.series([defaultLocale].concat(linguas).map(function (locale) {
    return createLocalizedBundle(locale)
  })),
  'clean:post'
))

function createLocalizedBundle (locale) {
  const dest = './dist/' + locale + '/'
  const scriptTask = makeScriptTask(dest, locale)
  scriptTask.displayName = 'script:' + locale

  return scriptTask
}

function makeScriptTask (dest, locale) {
  return function () {
    const transforms = JSON.parse(JSON.stringify(pkg.browserify.transform))
    const b = browserify({
      entries: './index.js',
      // See: https://github.com/nikku/karma-browserify/issues/130#issuecomment-120036815
      postFilter: function (id, file, currentPkg) {
        if (currentPkg.name === pkg.name) {
          currentPkg.browserify.transform = []
        }
        return true
      },
      transform: transforms.map(function (transform) {
        if (transform === '@offen/l10nify' || (Array.isArray(transform) && transform[0] === '@offen/l10nify')) {
          return ['@offen/l10nify', { locale: locale }]
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
