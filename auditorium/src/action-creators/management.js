/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const errors = require('./errors')

exports.handleCopy = (message) => ({
  type: 'COPY_SUCCESS',
  payload: {
    flash: message
  }
})

exports.shareAccount = (payload, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'SHARE_ACCOUNT_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'SHARE_ACCOUNT',
    payload: payload
  })
    .then((response) => {
      switch (response.type) {
        case 'SHARE_ACCOUNT_SUCCESS':
          dispatch({
            type: 'SHARE_ACCOUNT_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'SHARE_ACCOUNT_FAILURE':
          dispatch({
            type: 'SHARE_ACCOUNT_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Unhandled response of type "' + response.type + '"')
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.join = (update, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'JOIN_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'JOIN',
    payload: update
  })
    .then(function (response) {
      switch (response.type) {
        case 'JOIN_SUCCESS':
          dispatch({
            type: 'JOIN_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'JOIN_FAILURE':
          dispatch({
            type: 'JOIN_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Unhandled response of type "' + response.type + '"')
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.createAccount = (payload, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'CREATE_ACCOUNT_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'CREATE_ACCOUNT',
    payload: payload
  })
    .then(function (response) {
      switch (response.type) {
        case 'CREATE_ACCOUNT_SUCCESS':
          dispatch({
            type: 'CREATE_ACCOUNT_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'CREATE_ACCOUNT_FAILURE':
          dispatch({
            type: 'CREATE_ACCOUNT_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Unhandled response of type "' + response.type + '"')
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.retireAccount = (payload, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'RETIRE_ACCOUNT_REQUEST',
    payload: null
  })
  return postMessage({
    type: 'RETIRE_ACCOUNT',
    payload: payload
  })
    .then(function (response) {
      switch (response.type) {
        case 'RETIRE_ACCOUNT_SUCCESS':
          dispatch({
            type: 'RETIRE_ACCOUNT_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'RETIRE_ACCOUNT_FAILURE':
          dispatch({
            type: 'RETIRE_ACCOUNT_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Unhandled response of type "' + response.type + '"')
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.updateAccountStyles = (payload, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'UPDATE_ACCOUNT_STYLES_REQUEST',
    payload: null
  })
  return postMessage({
    type: 'UPDATE_ACCOUNT_STYLES',
    payload: payload
  })
    .then(function (response) {
      switch (response.type) {
        case 'UPDATE_ACCOUNT_STYLES_SUCCESS':
          dispatch({
            type: 'UPDATE_ACCOUNT_STYLES_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return true
        case 'UPDATE_ACCOUNT_STYLES_FAILURE':
          dispatch({
            type: 'UPDATE_ACCOUNT_STYLES_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return false
        default:
          throw new Error('Unhandled response of type "' + response.type + '"')
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}
