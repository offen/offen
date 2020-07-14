/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var fs = require('fs')
var crypto = require('crypto')
var gulp = require('gulp')
var clean = require('gulp-clean')
var browserify = require('browserify')
var uglify = require('gulp-uglify')
var source = require('vinyl-source-stream')
var rev = require('gulp-rev')
var buffer = require('vinyl-buffer')
var revReplace = require('gulp-rev-replace')
var sriHash = require('gulp-sri-hash')
var gap = require('gulp-append-prepend')
var to = require('flush-write-stream')
var UglifyJS = require('uglify-js')

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
  var dest = './dist/' + locale + '/vault/'
  var scriptTask = makeScriptTask(dest, locale)
  scriptTask.displayName = 'script:' + locale
  var vendorTask = makeVendorTask(dest)
  vendorTask.displayName = 'vendor:' + locale
  var revReplaceTask = makeRevReplaceTask(dest)
  revReplaceTask.displayName = 'revreplace:' + locale

  return gulp.series(
    gulp.parallel(scriptTask, vendorTask),
    revReplaceTask
  )
}

function makeScriptTask (dest, locale) {
  return function () {
    var transforms = JSON.parse(JSON.stringify(pkg.browserify.transform))
    var b = browserify({
      entries: './index.js',
      // See: https://github.com/nikku/karma-browserify/issues/130#issuecomment-120036815
      postFilter: function (id, file, currentPkg) {
        if (currentPkg.name === pkg.name) {
          currentPkg.browserify.transform = []
        }
        return true
      },
      transform: transforms.map(function (transform) {
        if (transform === 'offen/localize') {
          return ['offen/localize', { locale: locale }]
        }
        return transform
      })
    })

    return b
      .exclude('dexie')
      .plugin('split-require', {
        dir: dest,
        filename: function (entry) {
          return 'chunk-' + entry.index + '.js'
        },
        output: function (bundleName) {
          var buf = ''
          return to(onwrite, onend)

          function onwrite (chunk, enc, cb) {
            buf += chunk
            cb()
          }

          function onend (cb) {
            var minified = UglifyJS.minify(buf)
            if (minified.error) {
              return cb(minified.error)
            }
            var hash = crypto.createHash('sha1').update(minified.code)
            var name = bundleName.replace(/\.js$/, '') + '-' + hash.digest('hex').slice(0, 10) + '.js'
            this.emit('name', name)
            fs.writeFile(dest + name, minified.code, cb)
          }
        }
      })
      .bundle()
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gap.prependText('*/'))
      .pipe(gap.prependFile('./../banner.txt'))
      .pipe(gap.prependText('/**'))
      .pipe(rev())
      .pipe(gulp.dest(dest))
      .pipe(rev.manifest(dest + 'rev-manifest.json', { base: dest, merge: true }))
      .pipe(gulp.dest(dest))
  }
}

function makeVendorTask (dest) {
  return function () {
    var b = browserify()

    return b
      .require('dexie')
      .plugin('tinyify')
      .bundle()
      .pipe(source('vendor.js'))
      .pipe(buffer())
      .pipe(gap.prependText('*/'))
      .pipe(gap.prependFile('./../banner.txt'))
      .pipe(gap.prependText('/**'))
      .pipe(rev())
      .pipe(gulp.dest(dest))
      .pipe(rev.manifest(dest + 'rev-manifest.json', { base: dest, merge: true }))
      .pipe(gulp.dest(dest))
  }
}

function makeRevReplaceTask (dest) {
  return function () {
    return gulp.src('./index.html')
      .pipe(gap.prependText('-->'))
      .pipe(gap.prependFile('./../banner.txt'))
      .pipe(gap.prependText('<!--'))
      .pipe(revReplace({ manifest: gulp.src(dest + 'rev-manifest.json') }))
      .pipe(gulp.dest(dest))
      .pipe(sriHash({ relative: true }))
      .pipe(gulp.dest(dest))
  }
}
