var handleFetchResponse = require('offen/fetch-response')

exports.getAccount = getAccountWith(window.location.origin + '/api/accounts')
exports.getAccountWith = getAccountWith

function getAccountWith (accountsUrl) {
  return function (accountId, params) {
    params = params || {}
    var url = new window.URL(accountsUrl)
    url.search = new window.URLSearchParams(
      Object.assign(params, { accountId: accountId })
    )
    return window
      .fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}

exports.getEvents = getEventsWith(window.location.origin + '/api/events')
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
      .then(function (response) {
        if (response === null) {
          // this means the server responded with a 204
          // and the user likely has Do Not Track enabled.
          return { events: {} }
        }
        return response
      })
  }
}

exports.postEvent = postEventWith(window.location.origin + '/api/events')
exports.postEventWith = postEventWith

function postEventWith (eventsUrl) {
  return function (accountId, payload, anonymous) {
    var url = new window.URL(eventsUrl)
    if (anonymous) {
      url.search = new window.URLSearchParams({ anonymous: '1' })
    }
    return window
      .fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          accountId: accountId,
          payload: payload
        })
      })
      .then(handleFetchResponse)
  }
}

exports.getDeletedEvents = getDeletedEventsWith(window.location.origin + '/api/deleted')
exports.getDeletedEventsWith = getDeletedEventsWith

function getDeletedEventsWith (deletedEventsUrl) {
  return function (eventIds, isUser) {
    var url = new window.URL(deletedEventsUrl)
    if (isUser) {
      url.search = new window.URLSearchParams({ user: '1' })
    }
    return window
      .fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          eventIds: eventIds
        })
      })
      .then(handleFetchResponse)
  }
}

exports.getPublicKey = getPublicKeyWith(window.location.origin + '/api/exchange')
exports.getPublicKeyWith = getPublicKeyWith

function getPublicKeyWith (exchangeUrl) {
  return function (accountId) {
    var url = new window.URL(exchangeUrl)
    url.search = new window.URLSearchParams({ accountId: accountId })
    return window
      .fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      .then(handleFetchResponse)
      .then(function (response) {
        return response.publicKey
      })
  }
}

exports.postUserSecret = postUserSecretWith(window.location.origin + '/api/exchange')
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

exports.login = loginWith(window.location.origin + '/api/login')
exports.loginWith = loginWith

function loginWith (loginUrl) {
  return function (credentials) {
    return credentials
      ? window
        .fetch(loginUrl, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(credentials)
        })
        .then(handleFetchResponse)
      : window
        .fetch(loginUrl, {
          method: 'GET',
          credentials: 'include'
        })
        .then(handleFetchResponse)
  }
}

exports.purge = purgeWith(window.location.origin + '/api/purge')
exports.purgeWith = purgeWith

function purgeWith (purgeUrl) {
  return function () {
    return window
      .fetch(purgeUrl, {
        method: 'POST',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}

exports.optout = optoutWith(window.location.origin + '/api/opt-out')
exports.optoutWith = optoutWith

function optoutWith (optoutUrl) {
  return function () {
    return safelyReceiveCookies(optoutUrl)
  }
}

exports.optin = optoutWith(window.location.origin + '/api/opt-in')
exports.optinWith = optinWith

function optinWith (optinUrl) {
  return function () {
    return safelyReceiveCookies(optinUrl)
  }
}

// This is being used for setting and deleting opt-out cookies. It requires
// the two-step process so this can really be protected using the Same-Origin-Policy.
// If this would use a single call only, CORS would only protect the response payload, yet
// the Set-Cookie header would also have effects on a request that would be
// blocked by the CORS configuration. By requiring the server generated payload
// to actually set the cookie, we can make sure the caller has actually passed
// the CORS requirements.
function safelyReceiveCookies (endpointUrl) {
  return window
    .fetch(endpointUrl, {
      method: 'POST',
      credentials: 'include'
    })
    .then(handleFetchResponse)
    .then(function (params) {
      var url = new window.URL(endpointUrl)
      url.search = new window.URLSearchParams(params)
      return window.fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
    })
    .then(handleFetchResponse)
}
