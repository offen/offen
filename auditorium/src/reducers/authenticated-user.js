/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (state = null, action) => {
  switch (action.type) {
    case 'AUTHENTICATION_SUCCESS':
      return action.payload
    case 'LOGOUT_SUCCESS':
    case 'SESSION_AUTHENTICATION_FAILURE':
    case 'AUTHENTICATION_FAILURE':
    case 'RESET_PASSWORD_SUCCESS':
    case 'FORGOT_PASSWORD_SUCCESS':
    case 'CHANGE_CREDENTIALS_SUCCESS':
    case 'CREATE_ACCOUNT_SUCCESS':
    case 'JOIN_SUCCESS':
      return null
    default:
      return state
  }
}
