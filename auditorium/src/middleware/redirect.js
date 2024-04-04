/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const { route } = require('preact-router')

module.exports = (store) => (next) => (action) => {
  const routeWithLocale = (arg) => {
    const { queryParams } = store.getState()
    if (!queryParams.locale) {
      return route(arg)
    }
    const next = new window.URL(arg, window.location.origin)
    next.searchParams.set('locale', queryParams.locale)
    return route(next.pathname + next.search)
  }

  switch (action.type) {
    case 'LOGIN_SUCCESS':
      next(action)
      var currentUrl = new window.URL(window.location.href)
      if (currentUrl.searchParams.get('next')) {
        routeWithLocale(currentUrl.searchParams.get('next'))
        return
      }
      if (!Array.isArray(action.payload.accounts) || !action.payload.accounts.length) {
        routeWithLocale('/console/')
        return
      }
      routeWithLocale(`/auditorium/${action.payload.accounts[0].accountId}/`)
      return
    case 'SESSION_AUTHENTICATION_FAILURE':
      next(action)
      routeWithLocale('/login/?next=' + window.encodeURIComponent(window.location.pathname + window.location.search))
      return
    case 'AUTHENTICATION_FAILURE':
    case 'LOGOUT_SUCCESS':
    case 'RESET_PASSWORD_SUCCESS':
    case 'CHANGE_CREDENTIALS_SUCCESS':
    case 'CREATE_ACCOUNT_SUCCESS':
    case 'RETIRE_ACCOUNT_SUCCESS':
    case 'JOIN_SUCCESS':
    case 'SETUP_SUCCESS':
      next(action)
      routeWithLocale('/login/')
      return
    case 'SETUP_STATUS_HASDATA':
      next(action)
      routeWithLocale('/')
      return
    case 'EXPRESS_CONSENT_SUCCESS':
      return window.location.reload()
    default:
      next(action)
  }
}
