/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path')
const handleFetchResponse = require('offen/fetch-response')

exports.getAccount = getAccountWith(window.location.origin + '/api/accounts')
exports.getAccountWith = getAccountWith

function getAccountWith (accountsUrl) {
  return function (accountId, params) {
    params = params || {}
    const url = new window.URL(accountsUrl + '/' + accountId)
    url.search = new window.URLSearchParams(params)
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
    const url = new window.URL(accountsUrl)
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
  return function (accountId, payload) {
    const url = new window.URL(eventsUrl)
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
    const url = new window.URL(deletedEventsUrl)
    if (isUser) {
      url.pathname += '/user'
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
    const url = new window.URL(exchangeUrl)
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
  return function (username, password) {
    return (username && password)
      ? window
          .fetch(loginUrl, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
              username: username,
              password: password
            })
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

exports.logout = logoutWith(window.location.origin + '/api/logout')
exports.logoutWith = logoutWith

function logoutWith (logoutUrl) {
  return function () {
    return window
      .fetch(logoutUrl, {
        method: 'POST',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}

exports.changePassword = changePasswordWith(window.location.origin + '/api/change-password')
exports.changePasswordWith = changePasswordWith

function changePasswordWith (loginUrl) {
  return function (currentPassword, changedPassword) {
    return window
      .fetch(loginUrl, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          changedPassword: changedPassword,
          currentPassword: currentPassword
        })
      })
      .then(handleFetchResponse)
  }
}

exports.forgotPassword = forgotPasswordWith(window.location.origin + '/api/forgot-password')
exports.forgotPasswordWith = forgotPasswordWith

function forgotPasswordWith (forgotUrl) {
  return function (emailAddress, urlTemplate) {
    return window
      .fetch(forgotUrl, {
        method: 'POST',
        body: JSON.stringify({
          emailAddress: emailAddress,
          urlTemplate: urlTemplate
        })
      })
      .then(handleFetchResponse)
  }
}

exports.resetPassword = resetPasswordWith(window.location.origin + '/api/reset-password')
exports.resetPasswordWith = resetPasswordWith

function resetPasswordWith (resetUrl) {
  return function (emailAddress, password, token) {
    return window
      .fetch(resetUrl, {
        method: 'POST',
        body: JSON.stringify({
          emailAddress: emailAddress,
          password: password,
          token: token
        })
      })
      .then(handleFetchResponse)
  }
}

exports.changeEmail = changeEmailWith(window.location.origin + '/api/change-email')
exports.changeEmailWith = changeEmailWith

function changeEmailWith (loginUrl) {
  return function (emailAddress, emailCurrent, password) {
    return window
      .fetch(loginUrl, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          emailAddress: emailAddress,
          emailCurrent: emailCurrent,
          password: password
        })
      })
      .then(handleFetchResponse)
  }
}

exports.purge = purgeWith(window.location.origin + '/api/purge')
exports.purgeWith = purgeWith

function purgeWith (purgeUrl) {
  return function (deleteUserCookie) {
    const url = new window.URL(purgeUrl)
    if (deleteUserCookie) {
      url.search = new window.URLSearchParams({ user: '1' })
    }
    return window
      .fetch(url, {
        method: 'POST',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}

exports.shareAccount = shareAccountWith(window.location.origin + '/api/share-account')
exports.shareAccountWith = shareAccountWith

function shareAccountWith (inviteUrl) {
  return function (invitee, emailAddress, password, urlTemplate, accountId, grantAdminPrivileges) {
    const url = new window.URL(inviteUrl)
    if (accountId) {
      url.pathname = path.join(url.pathname, accountId)
    }
    return window
      .fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          invitee: invitee,
          emailAddress: emailAddress,
          password: password,
          urlTemplate: urlTemplate,
          grantAdminPrivileges: grantAdminPrivileges
        })
      })
      .then(handleFetchResponse)
  }
}

exports.join = joinWith(window.location.origin + '/api/join')
exports.joinWith = joinWith

function joinWith (joinUrl) {
  return function (emailAddress, password, token) {
    return window
      .fetch(joinUrl, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          emailAddress: emailAddress,
          password: password,
          token: token
        })
      })
      .then(handleFetchResponse)
  }
}

exports.createAccount = createAccountWith(window.location.origin + '/api/accounts')
exports.createAccountWith = createAccountWith

function createAccountWith (createUrl) {
  return function (accountName, emailAddress, password) {
    return window
      .fetch(createUrl, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          accountName: accountName,
          emailAddress: emailAddress,
          password: password
        })
      })
      .then(handleFetchResponse)
  }
}

exports.retireAccount = retireAccountWith(window.location.origin + '/api/accounts')
exports.retireAccountWith = retireAccountWith

function retireAccountWith (deleteUrl) {
  return function (accountId) {
    return window
      .fetch(deleteUrl + '/' + accountId, {
        method: 'DELETE',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}

exports.setup = setupWith(window.location.origin + '/api/setup')
exports.setupWith = setupWith

function setupWith (setupUrl) {
  return function (accountName, emailAddress, password) {
    return window
      .fetch(setupUrl, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          accountName: accountName,
          emailAddress: emailAddress,
          password: password
        })
      })
      .then(handleFetchResponse)
  }
}

exports.setupStatus = setupStatusWith(window.location.origin + '/api/setup')
exports.setupStatusWith = setupStatusWith

function setupStatusWith (setupUrl) {
  return function (accountName, emailAddress, password) {
    return window
      .fetch(setupUrl, {
        method: 'GET',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}
