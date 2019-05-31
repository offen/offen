var handleFetchResponse = require('offen/fetch-response')

module.exports = decryptPrivateKey

function decryptPrivateKey (encryptedKey) {
  var url = new window.URL(`${process.env.KMS_HOST}/decrypt`)
  url.search = new window.URLSearchParams({ jwk: '1' })
  return window
    .fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ encrypted: encryptedKey })
    })
    .then(handleFetchResponse)
}
