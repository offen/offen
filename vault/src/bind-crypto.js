var webCrypto = require('./web-crypto')

module.exports = bindCrypto

function bindCrypto (consumerFn) {
  return function () {
    var args = [].slice.call(arguments)
    return Promise.resolve(webCrypto)
      .then(function (cryptoImplementation) {
        return consumerFn.apply(cryptoImplementation, args)
      })
  }
}
