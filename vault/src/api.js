var handleFetchResponse = require('offen/fetch-response')

exports.decryptPrivateKey = decryptPrivateKeyWith(process.env.KMS_HOST + '/decrypt')
exports.decryptPrivateKeyWith = decryptPrivateKeyWith

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

exports.getAccount = getAccountWith(process.env.SERVER_HOST + '/accounts')
exports.getAccountWith = getAccountWith

function getAccountWith (accountsUrl) {
  return function (accountId) {
    var url = new window.URL(accountsUrl)
    url.search = new window.URLSearchParams({ account_id: accountId })
    return window
      .fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}

exports.getEvents = getEventsWith(process.env.SERVER_HOST + '/events')
exports.getEventsWith = getEventsWith

function getEventsWith (accountsUrl) {
  return function (query) {
    var url = new window.URL(accountsUrl)
    if (query) {
      url.search = new window.URLSearchParams(query)
    }
    return window
      .fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}

exports.postEvent = postEventWith(process.env.SERVER_HOST + '/events')
exports.postEventWith = postEventWith

function postEventWith (eventsUrl) {
  return function (body) {
    return window
      .fetch(eventsUrl, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(body)
      })
      .then(handleFetchResponse)
  }
}

exports.getPublicKey = getPublicKeyWith(process.env.SERVER_HOST + '/exchange')
exports.getPublicKeyWith = getPublicKeyWith

function getPublicKeyWith (exchangeUrl) {
  return function (accountId) {
    var url = new window.URL(exchangeUrl)
    url.search = new window.URLSearchParams({ account_id: accountId })
    return window
      .fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}

exports.postUserSecret = postUserSecretWith(process.env.SERVER_HOST + '/exchange')
exports.postUserSecretWith = postUserSecretWith

function postUserSecretWith (exchangeUrl) {
  return function (body) {
    return window
      .fetch(exchangeUrl, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(body)
      })
      .then(handleFetchResponse)
  }
}
