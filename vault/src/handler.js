/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

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

exports.handleConsentStatus = handleConsentStatusWith(consentStatus.get, allowsCookies)
exports.handleConsentStatusWith = handleConsentStatusWith

function handleConsentStatusWith (getConsentStatus, allowsCookies) {
  return function (message) {
    return {
      type: 'CONSENT_STATUS_SUCCESS',
      payload: {
        status: getConsentStatus(),
        allowsCookies: allowsCookies()
      }
    }
  }
}

exports.handleExpressConsent = handleExpressConsentWith(api, queries, consentStatus.get)
exports.handleExpressConsentWith = handleExpressConsentWith

function handleExpressConsentWith (api, queries, getConsentStatus) {
  return function (message) {
    var status = message.payload.status
    if ([consentStatus.ALLOW, consentStatus.DENY].indexOf(status) < 0) {
      return Promise.reject(new Error('Received invalid consent status: ' + status))
    }
    consentStatus.set(status)
    var purge = status === consentStatus.ALLOW
      ? Promise.resolve()
      : Promise.all([
        api
          .purge(true)
          .catch(function (err) {
            if (err.status === 400) {
              // users might request to delete data even if they do not have any
              // associated, so a 400 response is ok here
              return null
            }
            throw err
          }),
        queries.purge()
      ])
    return purge.then(function () {
      return {
        type: 'EXPRESS_CONSENT_SUCCESS',
        payload: {
          status: getConsentStatus(),
          allowsCookies: allowsCookies()
        }
      }
    })
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
    return Promise.all([
      api
        .purge()
        .catch(function (err) {
          if (err.status === 400) {
            return null
          }
          throw err
        }),
      queries.purge()
    ])
      .then(function () {
        return handleQuery(message)
      })
  }
}

exports.handleLogout = handleLogoutWith(api)
exports.handleLogoutWith = handleLogoutWith

function handleLogoutWith (api) {
  return function () {
    return api.logout()
      .then(function () {
        return {
          type: 'LOGOUT_SUCCESS',
          payload: null
        }
      }, function (err) {
        return {
          type: 'LOGOUT_FAILURE',
          payload: {
            message: err.message
          }
        }
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
            if (response.accountUserId !== storedResponse.accountUserId) {
              var mismatchErr = new Error('Received account user id did not match local session')
              mismatchErr.status = 401
              throw mismatchErr
            }
            return storedResponse
          })
      })
      .then(function (response) {
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
    } else if (payload.emailCurrent && payload.emailAddress && payload.password) {
      doRequest = function () {
        return api.changeEmail(payload.emailAddress, payload.emailCurrent, payload.password)
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

exports.handleShareAccount = handleShareAccountWith(api)
exports.handleShareAccountWith = handleShareAccountWith

function handleShareAccountWith (api) {
  return proxyThunk(function (payload) {
    return api.shareAccount(payload.invitee, payload.emailAddress, payload.password, payload.urlTemplate, payload.accountId)
  })
}

exports.handleJoin = handleJoinWith(api)
exports.handleJoinWith = handleJoinWith

function handleJoinWith (api) {
  return proxyThunk(function (payload) {
    return api.join(payload.emailAddress, payload.password, payload.token)
  })
}

exports.handleCreateAccount = handleCreateAccountWith(api)
exports.handleCreateAccountWith = handleCreateAccountWith

function handleCreateAccountWith (api) {
  return proxyThunk(function (payload) {
    return api.createAccount(payload.accountName, payload.emailAddress, payload.password)
  })
}

exports.handleRetireAccount = handleRetireAccountWith(api)
exports.handleRetireAccountWith = handleRetireAccountWith

function handleRetireAccountWith (api) {
  return proxyThunk(function (payload) {
    return api.retireAccount(payload.accountId)
  })
}

exports.handleSetup = handleSetupWith(api)
exports.handleSetupWith = handleSetupWith

function handleSetupWith (api) {
  return proxyThunk(function (payload) {
    return api.setup(payload.accountName, payload.emailAddress, payload.password)
  })
}

exports.handleSetupStatus = handleSetupStatusWith(api)
exports.handleSetupStatusWith = handleSetupStatusWith

function handleSetupStatusWith (api) {
  return function () {
    return api.setupStatus()
      .then(function () {
        return {
          type: 'SETUP_STATUS_EMPTY',
          payload: null
        }
      })
      .catch(function () {
        return {
          type: 'SETUP_STATUS_HASDATA',
          payload: null
        }
      })
  }
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
