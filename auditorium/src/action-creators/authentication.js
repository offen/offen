const errors = require('./errors')

exports.login = (username, password, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'AUTHENTICATION_REQUEST',
    payload: null
  })
  var credentials = username && password
    ? { username: username, password: password }
    : null

  return postMessage({
    type: 'LOGIN',
    payload: { credentials: credentials }
  })
    .then((response) => {
      switch (response.type) {
        case 'LOGIN_SUCCESS':
          dispatch({
            type: 'AUTHENTICATION_SUCCESS',
            payload: response.payload
          })
          if (credentials) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: response.payload
            })
          }
          return
        case 'LOGIN_FAILURE':
          dispatch({
            type: 'AUTHENTICATION_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Received unknown response type: ' + response.type)
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.logout = (onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'LOGOUT_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'LOGOUT',
    payload: null
  })
    .then((response) => {
      switch (response.type) {
        case 'LOGOUT_SUCCESS':
          dispatch({
            type: 'LOGOUT_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'LOGOUT_FAILURE':
          dispatch({
            type: 'LOGOUT_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Received unknown response type: ' + response.type)
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.resetPassword = (update, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'RESET_PASSWORD_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'RESET_PASSWORD',
    payload: update
  })
    .then((response) => {
      switch (response.type) {
        case 'RESET_PASSWORD_SUCCESS':
          dispatch({
            type: 'RESET_PASSWORD_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'RESET_PASSWORD_FAILURE':
          dispatch({
            type: 'RESET_PASSWORD_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Received unknown response type: ' + response.type)
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.forgotPassword = (update, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'FORGOT_PASSWORD_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'FORGOT_PASSWORD',
    payload: update
  })
    .then(function (response) {
      switch (response.type) {
        case 'FORGOT_PASSWORD_SUCCESS':
          dispatch({
            type: 'FORGOT_PASSWORD_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'FORGOT_PASSWORD_FAILURE':
          dispatch({
            type: 'FORGOT_PASSWORD_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Received unknown response type: ' + response.type)
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.changeCredentials = (update, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'CHANGE_CREDENTIALS_SUCCESS',
    payload: null
  })

  return postMessage({
    type: 'CHANGE_CREDENTIALS',
    payload: update
  })
    .then((response) => {
      switch (response.type) {
        case 'CHANGE_CREDENTIALS_SUCCESS':
          dispatch({
            type: 'CHANGE_CREDENTIALS_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'CHANGE_CREDENTIALS_FAILURE':
          dispatch({
            type: 'CHANGE_CREDENTIALS_FAILURE',
            payload: {
              flash: onFailureMessage
            }
          })
          return
        default:
          throw new Error('Received unknown response type: ' + response.type)
      }
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}
