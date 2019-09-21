var api = require('./api')
var queries = require('./queries')
var relayEvent = require('./relay-event')
var hasOptedOut = require('./user-optout')
var allowsCookies = require('./allows-cookies')
var getUserEvents = require('./get-user-events')
var getOperatorEvents = require('./get-operator-events')

exports.handleAnalyticsEvent = handleAnalyticsEventWith(relayEvent)
exports.handleAnalyticsEventWith = handleAnalyticsEventWith

function handleAnalyticsEventWith (relayEvent) {
  return function (message) {
    var accountId = message.payload.accountId
    return relayEvent(accountId, message.payload.event, false)
  }
}

exports.handleAnonymousEvent = handleAnonymousEventWith(relayEvent)
exports.handleAnonymousEventWith = handleAnonymousEventWith

function handleAnonymousEventWith (relayEvent) {
  return function (message) {
    var accountId = message.payload.accountId
    return relayEvent(accountId, message.payload.event, true)
  }
}

exports.handleOptout = handleOptoutWith(api)
exports.handleOptoutWith = handleOptoutWith

function handleOptoutWith (api) {
  return function (message) {
    var status = (message.payload && message.payload.status) || false
    return (status ? api.optout() : api.optin())
      .then(function () {
        return {
          type: 'OPTOUT_SUCCESS'
        }
      })
  }
}

exports.handleOptoutStatus = handleOptoutStatusWith(hasOptedOut, allowsCookies)
exports.handleOptoutStatusWith = handleOptoutStatusWith

function handleOptoutStatusWith (hasOptedOut, allowsCookies) {
  return function (message) {
    return {
      type: 'OPTOUT_STATUS',
      payload: {
        hasOptedOut: hasOptedOut(),
        allowsCookies: allowsCookies()
      }
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
          type: 'QUERY_RESULT',
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
  return function (message) {
    var doRequest = function () {
      return Promise.reject(new Error('Could not match message payload.'))
    }
    var payload = message.payload
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
      .then(function (response) {
        return {
          type: 'CHANGE_CREDENTIALS_SUCCESS'
        }
      })
      .catch(function (err) {
        if (err.status === 401) {
          return {
            type: 'CHANGE_CREDENTIALS_FAILURE',
            payload: {
              message: err.message
            }
          }
        }
        throw err
      })
  }
}

exports.handleForgotPassword = handleForgotPasswordWith(api)
exports.handleForgotPasswordWith = handleForgotPasswordWith

function handleForgotPasswordWith (api) {
  return function (message) {
    return api.forgotPassword(message.payload.emailAddress, message.payload.urlTemplate)
      .then(function (response) {
        return {
          type: 'FORGOT_PASSWORD_SUCCESS'
        }
      })
      .catch(function (err) {
        if (err.status < 500) {
          return {
            type: 'FORGOT_PASSWORD_FAILURE',
            payload: {
              message: err.message
            }
          }
        }
        throw err
      })
  }
}

exports.handleResetPassword = handleResetPasswordWith(api)
exports.handleResetPasswordWith = handleResetPasswordWith

function handleResetPasswordWith (api) {
  return function (message) {
    var payload = message.payload
    return api.resetPassword(payload.emailAddress, payload.password, payload.token)
      .then(function (response) {
        return {
          type: 'RESET_PASSWORD_SUCCESS'
        }
      })
      .catch(function (err) {
        if (err.status < 500) {
          return {
            type: 'RESET_PASSWORD_FAILURE',
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
