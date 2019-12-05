var forgeCrypto = require('./forge-crypto')
var webCrypto = require('./web-crypto')

module.exports = bindCrypto

var runtimeCrypto = window.crypto && window.crypto.subtle
  ? webCrypto
  : forgeCrypto

function bindCrypto (consumerFn) {
  return function () {
    var args = [].slice.call(arguments)
    return Promise.resolve(runtimeCrypto)
      .then(function (cryptoImplementation) {
        return consumerFn.apply(cryptoImplementation, args)
      })
  }
}
