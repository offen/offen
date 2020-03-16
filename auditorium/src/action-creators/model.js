/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const errors = require('./errors')

exports.query = (data, authenticatedUser, softFailureMessage, inBackground) => (dispatch, getState, postMessage) => {
  if (!inBackground) {
    dispatch({
      type: 'QUERY_REQUEST',
      payload: null
    })
  }

  const payload = data
    ? { query: data, authenticatedUser: authenticatedUser }
    : { authenticatedUser: authenticatedUser }

  return postMessage({
    type: 'QUERY',
    payload
  })
    .then((response) => {
      dispatch({
        type: 'QUERY_SUCCESS',
        payload: response.payload.result
      })
    })
    .catch((err) => {
      if (softFailureMessage) {
        dispatch({
          type: 'QUERY_FAILURE',
          payload: {
            flash: softFailureMessage
          }
        })
        return
      }
      dispatch(errors.unrecoverable(err))
    })
}

exports.purge = () => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'PURGE_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'PURGE',
    payload: null
  })
    .then((response) => {
      dispatch({
        type: 'PURGE_SUCCESS',
        payload: response.payload.result
      })
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}
