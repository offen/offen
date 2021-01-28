/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const errors = require('./errors')
const differenceInWeeks = require('date-fns/differenceInWeeks')
const differenceInMonths = require('date-fns/differenceInMonths')

exports.query = (data, authenticatedUser, softFailureMessage, inBackground) => (dispatch, getState, postMessage) => {
  if (!inBackground) {
    dispatch({
      type: 'QUERY_REQUEST',
      payload: null
    })
  }

  // in case a from and a to date are given but no resolution value, we try to
  // infer a value that makes sense to display
  if (data && data.from && data.to && !data.resolution) {
    const toDate = new Date(data.to)
    const fromDate = new Date(data.from)
    const weeks = differenceInWeeks(toDate, fromDate)
    const months = differenceInMonths(toDate, fromDate)

    // mobile and desktop screens use different rules
    if (window.matchMedia('screen and (min-width: 30em)')) {
      if (weeks >= 6) {
        data.resolution = 'weeks'
      }
      if (months >= 3) {
        data.resolution = 'months'
      }
    } else {
      if (weeks >= 4) {
        data.resolution = 'weeks'
      }
      if (months >= 3) {
        data.resolution = 'months'
      }
    }
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
