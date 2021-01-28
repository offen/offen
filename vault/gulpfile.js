/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs')
const crypto = require('crypto')
const gulp = require('gulp')
const clean = require('gulp-clean')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const rev = require('gulp-rev')
const buffer = require('vinyl-buffer')
const revReplace = require('gulp-rev-replace')
const sriHash = require('gulp-sri-hash')
const gap = require('gulp-append-prepend')
const to = require('flush-write-stream')
const tinyify = require('tinyify')
const minifyStream = require('minify-stream')

const defaultLocale = 'en'
const linguas = fs.readFileSync('./locales/LINGUAS', 'utf-8')
  .split(' ')
  .filter(Boolean)
  .map(function (s) {
    return s.trim()
  })

const pkg = require('./package.json')

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
  const dest = './dist/' + locale + '/vault/'
  const scriptTask = makeScriptTask(dest, locale)
  scriptTask.displayName = 'script:' + locale
  const vendorTask = makeVendorTask(dest)
  vendorTask.displayName = 'vendor:' + locale
  const revReplaceTask = makeRevReplaceTask(dest)
  revReplaceTask.displayName = 'revreplace:' + locale

  return gulp.series(
    gulp.parallel(scriptTask, vendorTask),
    revReplaceTask
  )
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

    b.on('split.pipeline', function (pipeline) {
      tinyify.applyToPipeline(pipeline)
    })

    return b
      .exclude('dexie')
      .plugin('split-require', {
        dir: dest,
        filename: function (entry) {
          return 'chunk-' + entry.index + '.js'
        },
        sri: 'sha384',
        output: function (bundleName) {
          let buf = ''
          return to(onwrite, onend)

          function onwrite (chunk, enc, cb) {
            buf += chunk
            cb()
          }

          function onend (cb) {
            const hash = crypto.createHash('sha1').update(buf)
            const name = bundleName.replace(/\.js$/, '') + '-' + hash.digest('hex').slice(0, 10) + '.js'
            this.emit('name', name)
            fs.writeFile(dest + name, buf, cb)
          }
        }
      })
      .transform('envify', { global: true })
      .transform('uglifyify', { global: true })
      .bundle()
      .pipe(minifyStream({ sourceMap: false }))
      .pipe(source('index.js'))
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

function makeVendorTask (dest) {
  return function () {
    const b = browserify()

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
