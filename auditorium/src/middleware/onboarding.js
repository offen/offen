/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const { route } = require('preact-router')

module.exports = (store) => (next) => (action) => {
  switch (action.type) {
    case 'ONBOARDING_COMPLETED': {
      const url = new window.URL(window.location.href)
      if (!url.searchParams.has('onboarding')) {
        break
      }
      url.searchParams.delete('onboarding')
      route(url.pathname + url.search)
      break
    }
    default:
  }
  next(action)
}
