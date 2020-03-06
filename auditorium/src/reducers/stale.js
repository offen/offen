/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (state = false, action) => {
  switch (action.type) {
    case 'QUERY_REQUEST':
      return true
    case 'QUERY_SUCCESS':
    case 'QUERY_FAILURE':
    case 'NAVIGATE':
      return false
    default:
      return state
  }
}
