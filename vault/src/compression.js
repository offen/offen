/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

exports.supported = function () {
  return typeof window.CompressionStream !== 'undefined' &&
    typeof window.DecompressionStream !== 'undefined' &&
    typeof window.Response !== 'undefined' &&
    typeof window.TextEncoder !== 'undefined' &&
    typeof window.TextDecoder !== 'undefined'
}

exports.compress = compress
function compress (string) {
  const byteArray = new window.TextEncoder().encode(string)
  const cs = new window.CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  writer.write(byteArray)
  writer.close()
  return new window.Response(cs.readable).arrayBuffer()
}

exports.decompress = decompress
function decompress (byteArray) {
  const cs = new window.DecompressionStream('gzip')
  const writer = cs.writable.getWriter()
  writer.write(byteArray)
  writer.close()
  return new window.Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
    return new window.TextDecoder().decode(arrayBuffer)
  })
}
