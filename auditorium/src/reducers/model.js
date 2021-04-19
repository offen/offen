/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (state = null, action) => {
  switch (action.type) {
    case 'QUERY_SUCCESS':
    case 'PURGE_SUCCESS':
    case 'PURGE_AGGREGATES_SUCCESS':
      return action.payload
    case 'UPDATE_ACCOUNT_STYLES_SUCCESS':
      return {
        ...state,
        account: {
          ...state.account,
          accountStyles: action.payload.accountStyles
        }
      }
    case 'NAVIGATE':
      return null
    default:
      return state
  }
}
