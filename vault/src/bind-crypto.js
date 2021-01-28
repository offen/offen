/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const splitRequire = require('split-require')

module.exports = bindCrypto

const cryptoProvider = window.crypto && window.crypto.subtle
  ? getWebCrypto()
  : getForgeCrypto()

function bindCrypto (consumerFn) {
  return function () {
    const args = [].slice.call(arguments)
    return cryptoProvider
      .then(function (cryptoImplementation) {
        return consumerFn.apply(cryptoImplementation, args)
      })
  }
}

function getWebCrypto () {
  return Promise.resolve(require('./web-crypto'))
}

function getForgeCrypto () {
  return new Promise(function (resolve, reject) {
    splitRequire('./forge-crypto', function (err, forgeCrypto) {
      if (err) {
        return reject(err)
      }
      resolve(forgeCrypto)
    })
  })
}
