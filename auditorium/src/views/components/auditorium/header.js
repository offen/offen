/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const HighlightBox = require('./../_shared/highlight-box')

const Header = (props) => {
  const { isOperator, accountName } = props
  let copy = null
  if (isOperator) {
    copy = __(
      'You are viewing data as operator with account <em class="%s">%s</em>.', 'i tracked',
      accountName
    )
  } else {
    copy = __('You are viewing your usage data.')
  }
  return (
    <HighlightBox
      dangerouslySetInnerHTML={{ __html: copy }}
    />
  )
}

module.exports = Header
