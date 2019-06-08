var handleFetchResponse = require('offen/fetch-response')

module.exports = decryptPrivateKeyWith(`${process.env.KMS_HOST}/decrypt`)
module.exports.decryptPrivateKeyWith = decryptPrivateKeyWith

function decryptPrivateKeyWith (kmsUrl) {
  return function (encryptedKey) {
    var url = new window.URL(kmsUrl)
    url.search = new window.URLSearchParams({ jwk: '1' })
    return window
      .fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ encrypted: encryptedKey })
      })
      .then(handleFetchResponse)
  }
}
