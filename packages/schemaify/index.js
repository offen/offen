/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var through = require('through2')

var Ajv = require('ajv')
var ajv = new Ajv({ sourceCode: true })
var pack = require('ajv-pack')

module.exports = transform

var isSchemaRe = /\.jsonschema$/

function transform (file, options) {
  if (!isSchemaRe.test(file)) {
    return through()
  }
  var buf = ''
  return through(function (chunk, enc, next) {
    buf += chunk
    next()
  }, function (done) {
    var validate
    try {
      validate = ajv.compile(JSON.parse(buf))
    } catch (err) {
      this.push(buf)
      this.push(null)
      return
    }
    var moduleCode = pack(ajv, validate)
    this.push(moduleCode)
    this.push(null)
  })
}
