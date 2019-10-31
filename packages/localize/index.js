var path = require('path')
var through = require('through2')
var jscodeshift = require('jscodeshift')
var util = require('util')

var locale = process.env.OFFEN_APP_LOCALE || 'en'
var sourceFile = path.join(process.cwd(), './../l10n/', locale)
var source = require(sourceFile)

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
    if (node.value.arguments.length === 1) {
      return jscodeshift.stringLiteral(
        source[node.value.arguments[0].value]
      )
    }
    // more than one argument means we want to do string interpolation
    var args = node.value.arguments.slice(1)
    var formatStr = source[node.value.arguments[0].value]
    var argValues = args.map(function (arg) {
      return arg.value
    })
    return jscodeshift.stringLiteral(
      util.format.apply(util, [formatStr].concat(argValues))
    )
  })
  callback(null, j.toSource())
}
