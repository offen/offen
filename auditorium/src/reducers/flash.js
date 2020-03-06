/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (state = [], action) => {
  switch (action.type) {
    case 'AUTHENTICATION_FAILURE':
    case 'SHARE_ACCOUNT_SUCCESS':
    case 'SHARE_ACCOUNT_FAILURE':
    case 'JOIN_SUCCESS':
    case 'JOIN_FAILURE':
    case 'CREATE_ACCOUNT_SUCCESS':
    case 'CREATE_ACCOUNT_FAILURE':
    case 'FORM_VALIDATION_ERROR':
    case 'FORGOT_PASSWORD_SUCCESS':
    case 'FORGOT_PASSWORD_FAILURE':
    case 'CHANGE_CREDENTIALS_SUCCESS':
    case 'CHANGE_CREDENTIALS_FAILURE':
    case 'RESET_PASSWORD_SUCCESS':
    case 'RESET_PASSWORD_FAILURE':
    case 'QUERY_FAILURE':
    case 'RETIRE_ACCOUNT_SUCCESS':
    case 'RETIRE_ACCOUNT_FAILURE':
    case 'SETUP_SUCCESS':
    case 'SETUP_FAILURE':
    case 'SETUP_STATUS_HASDATA':
    case 'LOGOUT_SUCCESS':
    case 'LOGOUT_FAILURE':
    case 'COPY_SUCCESS':
      if (action.payload && action.payload.flash) {
        return [
          {
            content: action.payload.flash,
            id: action.payload.flashId
          },
          ...state
        ]
      }
      return state
    case 'LOGIN_SUCCESS':
      return []
    case 'EXPIRE_FLASH':
      return state.filter((message) => {
        return message.id !== action.payload.flashId
      })
    default:
      return state
  }
}
