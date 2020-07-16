/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var through = require('through2')
var Ajv = require('ajv')
var pack = require('ajv-pack')

var ajv = new Ajv({ sourceCode: true })

module.exports = transform

var isSchemaRe = /\.schema$/
var isSchemaSecure = ajv.compile(require('ajv/lib/refs/json-schema-secure.json'))

function transform (file, options) {
  options = Object.assign({ secure: true }, options)

  var matcher = options.matcher
    ? new RegExp(options.matcher)
    : isSchemaRe

  if (!matcher.test(file)) {
    return through()
  }
  var buf = ''
  return through(function (chunk, enc, next) {
    buf += chunk
    next()
  }, function (done) {
    var moduleCode
    try {
      var schema = JSON.parse(buf)
      if (options.secure && !isSchemaSecure(schema)) {
        throw new Error(
          'Schema "' + file + '" is not secure, will not compile: ' + JSON.stringify(isSchemaSecure.errors)
        )
      }
      var validate = ajv.compile(schema)
      moduleCode = pack(ajv, validate)
    } catch (err) {
      return done(err)
    }
    this.push(moduleCode)
    this.push(null)
  })
}
