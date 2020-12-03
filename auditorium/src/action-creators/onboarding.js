/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const errors = require('./errors')

exports.getStatus = () => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'ONBOARDING_STATUS_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'ONBOARDING_STATUS',
    payload: null
  })
    .then((response) => {
      dispatch({
        type: 'ONBOARDING_STATUS_SUCCESS',
        payload: response.payload
      })
    })
    .catch((err) => dispatch(errors.unrecoverable(err)))
}

exports.setCompleted = () => {
  return {
    type: 'ONBOARDING_COMPLETED',
    payload: null
  }
}
