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
