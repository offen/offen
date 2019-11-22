var webCrypto = require('./web-crypto')
var splitRequire = require('split-require')

module.exports = bindCrypto

var cryptoProvider = window.crypto && window.crypto.subtle
  ? Promise.resolve(webCrypto)
  : getForgeCrypto()

function bindCrypto (consumerFn) {
  return function () {
    var args = [].slice.call(arguments)
    return cryptoProvider
      .then(function (cryptoImplementation) {
        return consumerFn.apply(cryptoImplementation, args)
      })
  }
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
