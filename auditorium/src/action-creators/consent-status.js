const errors = require('./errors')

exports.get = () => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'CONSENT_STATUS_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'CONSENT_STATUS',
    payload: null
  })
    .then((response) => {
      dispatch({
        type: 'CONSENT_STATUS_SUCCESS',
        payload: response.payload
      })
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.express = (status) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'EXPRESS_CONSENT_REQUEST',
    payload: null
  })
  return postMessage({
    type: 'EXPRESS_CONSENT',
    payload: {
      status: status
    }
  })
    .then((response) => {
      dispatch({
        type: 'EXPRESS_CONSENT_SUCCESS',
        payload: response.payload
      })
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}
