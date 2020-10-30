/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

exports.supported = function () {
  return typeof window.CompressionStream !== 'undefined' &&
    typeof window.DecompressionStream !== 'undefined'
}

exports.compress = compress
function compress (string) {
  var byteArray = new TextEncoder().encode(string)
  var cs = new window.CompressionStream('gzip')
  var writer = cs.writable.getWriter()
  writer.write(byteArray)
  writer.close()
  return new window.Response(cs.readable).arrayBuffer()
}

exports.decompress = decompress
function decompress (byteArray) {
  var cs = new window.DecompressionStream('gzip')
  var writer = cs.writable.getWriter()
  writer.write(byteArray)
  writer.close()
  return new window.Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
    return new TextDecoder().decode(arrayBuffer)
  })
}
