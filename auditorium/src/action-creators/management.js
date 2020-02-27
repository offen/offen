const errors = require('./errors')

exports.inviteUser = (payload, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'INVITE_USER_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'INVITE_USER',
    payload: payload
  })
    .then((response) => {
      switch (response.type) {
        case 'INVITE_USER_SUCCESS':
          dispatch({
            type: 'INVITE_USER_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'INVITE_USER_FAILURE':
          dispatch({
            type: 'INVITE_USER_FAILURE',
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
