/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (store) => (next) => (action) => {
  switch (action.type) {
    case 'NAVIGATE':
    case 'QUERY_SUCCESS': {
      const url = new window.URL(window.location.href)
      const queryParams = {}
      for (const [key, value] of url.searchParams.entries()) {
        queryParams[key] = value
      }
      store.dispatch({
        type: 'UDPATE_QUERY_PARAMS',
        payload: queryParams
      })
      next(action)
      break
    }
    default:
      next(action)
  }
}
