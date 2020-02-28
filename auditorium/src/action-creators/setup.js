const errors = require('./errors')

exports.setup = (payload, onSuccessMessage, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'SETUP_REQUEST',
    payload: null
  })
  return postMessage({
    type: 'SETUP',
    payload: payload
  })
    .then((response) => {
      switch (response.type) {
        case 'SETUP_SUCCESS':
          dispatch({
            type: 'SETUP_SUCCESS',
            payload: {
              flash: onSuccessMessage
            }
          })
          return
        case 'SETUP_FAILURE':
          dispatch({
            type: 'SETUP_FAILURE',
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

exports.status = (onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'SETUP_STATUS_REQUEST',
    payload: null
  })
  return postMessage({
    type: 'SETUP_STATUS',
    payload: null
  })
    .then((response) => {
      switch (response.type) {
        case 'SETUP_STATUS_EMPTY':
          dispatch({
            type: 'SETUP_STATUS_EMPTY',
            payload: null
          })
          return
        case 'SETUP_STATUS_HASDATA':
          dispatch({
            type: 'SETUP_STATUS_HASDATA',
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
