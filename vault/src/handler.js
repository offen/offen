var api = require('./api')
var queries = require('./queries')
var relayEvent = require('./relay-event')
var consentStatus = require('./user-consent')
var allowsCookies = require('./allows-cookies')
var getUserEvents = require('./get-user-events')
var getOperatorEvents = require('./get-operator-events')

exports.handleAnalyticsEvent = handleAnalyticsEventWith(relayEvent)
exports.handleAnalyticsEventWith = handleAnalyticsEventWith

function handleAnalyticsEventWith (relayEvent) {
  return function (message) {
    var accountId = message.payload.accountId
    var event = message.payload.event
    return relayEvent(accountId, event, false)
  }
}

exports.handleAnonymousEvent = handleAnonymousEventWith(relayEvent)
exports.handleAnonymousEventWith = handleAnonymousEventWith

function handleAnonymousEventWith (relayEvent) {
  return function (message) {
    var accountId = message.payload.accountId
    var event = message.payload.event
    return relayEvent(accountId, event, true)
  }
}

exports.handleOptinStatus = handleOptinStatusWith(consentStatus.get, allowsCookies)
exports.handleOptinStatusWith = handleOptinStatusWith

function handleOptinStatusWith (getConsentStatus, allowsCookies) {
  return function (message) {
    return {
      type: 'OPTIN_STATUS_SUCCESS',
      payload: {
        hasOptedIn: getConsentStatus() === 'allow',
        allowsCookies: allowsCookies()
      }
    }
  }
}

exports.handleOptin = handleOptinWith()
exports.handleOptinWith = handleOptinWith

function handleOptinWith () {
  return function (message) {
    consentStatus.set(message.payload.expressConsent)
    return {
      type: 'OPTIN_SUCCESS',
      payload: null
    }
  }
}

exports.handleQuery = handleQueryWith(getUserEvents, getOperatorEvents)
exports.handleQueryWith = handleQueryWith

function handleQueryWith (getUserEvents, getOperatorEvents) {
  return function (message) {
    var query = message.payload
      ? message.payload.query
      : null

    var authenticatedUser = message.payload
      ? message.payload.authenticatedUser
      : null

    var lookup = (query && query.accountId)
      ? getOperatorEvents(query, authenticatedUser)
      : getUserEvents(query)

    return lookup
      .then(function (result) {
        return {
          type: 'QUERY_SUCCESS',
          payload: {
            query: query,
            result: result
          }
        }
      })
  }
}

exports.handlePurge = handlePurgeWith(api, queries, getUserEvents, getOperatorEvents)
exports.handlePurgeWith = handlePurgeWith

function handlePurgeWith (api, queries, getUserEvents, getOperatorEvents) {
  var handleQuery = handleQueryWith(getUserEvents, getOperatorEvents)
  return function handlePurge (message) {
    return Promise.all([api.purge(), queries.purge()])
      .then(function () {
        return handleQuery(message)
      })
  }
}

exports.handleLogin = handleLoginWith(api, getFromSessionStorage, setInSessionStorage)
exports.handleLoginWith = handleLoginWith

function handleLoginWith (api, get, set) {
  return function (message) {
    var credentials = (message.payload && message.payload.credentials) || null

    return api.login(credentials)
      .then(function (response) {
        if (credentials) {
          return set(response)
        }
        return get()
          .then(function (storedResponse) {
            if (!storedResponse) {
              var noSessionErr = new Error('No local session found')
              noSessionErr.status = 401
              throw noSessionErr
            }
            if (response.userId !== storedResponse.userId) {
              var mismatchErr = new Error('Received user id did not match local session')
              mismatchErr.status = 401
              throw mismatchErr
            }
            return storedResponse
          })
      }).then(function (response) {
        return {
          type: 'LOGIN_SUCCESS',
          payload: response
        }
      })
      .catch(function (err) {
        if (err.status === 401) {
          return {
            type: 'LOGIN_FAILURE',
            payload: {
              message: err.message
            }
          }
        }
        throw err
      })
  }
}

exports.handleChangeCredentials = handleChangeCredentialsWith(api)
exports.handleChangeCredentialsWith = handleChangeCredentialsWith

function handleChangeCredentialsWith (api) {
  return proxyThunk(function (payload) {
    var doRequest = function () {
      return Promise.reject(new Error('Could not match message payload.'))
    }
    if (payload.currentPassword && payload.changedPassword) {
      doRequest = function () {
        return api.changePassword(payload.currentPassword, payload.changedPassword)
      }
    } else if (payload.emailAddress && payload.password) {
      doRequest = function () {
        return api.changeEmail(payload.emailAddress, payload.password)
      }
    }
    return doRequest()
  })
}

exports.handleForgotPassword = handleForgotPasswordWith(api)
exports.handleForgotPasswordWith = handleForgotPasswordWith

function handleForgotPasswordWith (api) {
  return proxyThunk(function (payload) {
    return api.forgotPassword(payload.emailAddress, payload.urlTemplate)
  })
}

exports.handleResetPassword = handleResetPasswordWith(api)
exports.handleResetPasswordWith = handleResetPasswordWith

function handleResetPasswordWith (api) {
  return proxyThunk(function (payload) {
    return api.resetPassword(payload.emailAddress, payload.password, payload.token)
  })
}

// proxyThunk can be used to create a handler that simply calls through
// to an api method without needing any further logic other than signalling
// success or failure
function proxyThunk (thunk) {
  return function (message) {
    return thunk(message.payload)
      .then(function (response) {
        return {
          type: message.type + '_SUCCESS'
        }
      })
      .catch(function (err) {
        if (err.status < 500) {
          return {
            type: message.type + '_FAILURE',
            payload: {
              message: err.message
            }
          }
        }
        throw err
      })
  }
}

function getFromSessionStorage () {
  try {
    var persisted = window.sessionStorage.getItem('session')
    return Promise.resolve(JSON.parse(persisted))
  } catch (err) {
    return Promise.reject(err)
  }
}

function setInSessionStorage (value) {
  try {
    var serialized = JSON.stringify(value)
    window.sessionStorage.setItem('session', serialized)
    return Promise.resolve(value)
  } catch (err) {
    return Promise.reject(err)
  }
}
