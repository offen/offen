/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var through = require('through2')

module.exports = transform

var isSvg = /\.svg$/

function transform (file) {
  if (!isSvg.test(file)) {
    return through()
  }
  var buf = ''
  return through(function (chunk, enc, next) {
    buf += chunk
    next()
  }, function (done) {
    var mod = [
      'module.exports = "data:image/svg+xml;base64,',
      Buffer.from(buf).toString('base64'),
      '";'
    ].join('')
    this.push(mod)
    this.push(null)
  })
}
