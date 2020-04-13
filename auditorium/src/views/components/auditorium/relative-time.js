/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')

const RelativeTime = (props) => {
  const { children, invert } = props
  let display = null
  if (children === 0) {
    display = __('Now')
  } else {
    display = invert ? __('%d days later', children * 7) : __('%d days earlier', children * 7)
  }
  return (
    <Fragment>
      {display}
    </Fragment>
  )
}

module.exports = RelativeTime
