var fs = require('fs')
var crypto = require('crypto')
var gulp = require('gulp')
var clean = require('gulp-clean')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var rev = require('gulp-rev')
var buffer = require('vinyl-buffer')
var revReplace = require('gulp-rev-replace')
var sriHash = require('gulp-sri-hash')
var gap = require('gulp-append-prepend')
var to = require('flush-write-stream')

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
      .exclude('dexie')
      .plugin('split-require', {
        dir: dest,
        sri: 'sha384',
        filename: function (entry) {
          return 'chunk' + entry.index + '.js'
        },
        output: function (bundleName) {
          var stream = fs.createWriteStream(dest + bundleName)
          var hash = crypto.createHash('sha1')
          return to(onwrite, onend)

          function onwrite (chunk, enc, cb) {
            hash.update(chunk)
            stream.write(chunk, cb)
          }
          function onend (cb) {
            stream.end()
            var name = bundleName.replace(/\.js$/, '') + '-' + hash.digest('hex').slice(0, 10) + '.js'
            this.emit('name', name)
            fs.rename(dest + bundleName, dest + name, cb)
          }
        }
      })
      .plugin('tinyify')
      .bundle()
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
