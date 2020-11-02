/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const errors = require('./errors')

exports.purgeAggregates = (accountId, onFailureMessage) => (dispatch, getState, postMessage) => {
  dispatch({
    type: 'PURGE_AGGREGATES_REQUEST',
    payload: null
  })

  return postMessage({
    type: 'PURGE_AGGREGATES',
    payload: {
      accountId: accountId
    }
  })
    .then((response) => {
      switch (response.type) {
        case 'PURGE_AGGREGATES_SUCCESS':
          dispatch({
            type: 'PURGE_AGGREGATES_SUCCESS',
            payload: null
          })
          return
        case 'PURGE_AGGREGATES_FAILURE':
          dispatch({
            type: 'PURGE_AGGREGATES_FAILURE',
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
