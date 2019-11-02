var fs = require('fs')
var path = require('path')
var through = require('through2')
var jscodeshift = require('jscodeshift')

var defaultLocale = 'en'
var locale = process.env.OFFEN_BUILD_LOCALE || defaultLocale
var sourceFile = path.join(process.cwd(), './locales.json')

module.exports = transform

function transform (file) {
  var buf = ''
  return through(function (chunk, enc, next) {
    buf += chunk.toString('utf-8')
    next()
  }, function (done) {
    var self = this
    inlineStrings(buf, function (err, result) {
      if (err) {
        return done(err)
      }
      self.push(result)
      done()
    })
  })
}

function inlineStrings (sourceString, callback) {
  fs.readFile(sourceFile, 'utf-8', function (err, data) {
    if (err) {
      return callback(err)
    }
    var stringMap = JSON.parse(data)
    var j = jscodeshift(sourceString)
    var calls = j.find(jscodeshift.CallExpression, {
      callee: {
        type: 'Identifier',
        name: '__'
      }
    })

    calls.replaceWith(function (node) {
      if (node.value.arguments.length === 0) {
        return node
      }

      var formatStr = locale === defaultLocale
        ? node.value.arguments[0].value
        : stringMap[node.value.arguments[0].value] || node.value.arguments[0].value
      // one arguments means the call can just be replaced by its
      // string counterpart
      if (node.value.arguments.length === 1) {
        return jscodeshift.stringLiteral(formatStr)
      }

      // more than one argument means we want to do string interpolation
      var args = node.value.arguments.slice(1)

      return jscodeshift.callExpression(
        jscodeshift.memberExpression(
          jscodeshift.callExpression(
            jscodeshift.identifier('require'),
            [
              jscodeshift.stringLiteral('util')
            ]
          ),
          jscodeshift.identifier('format')
        ),
        [jscodeshift.stringLiteral(formatStr)].concat(args)
      )
    })
    callback(null, j.toSource())
  })
}
