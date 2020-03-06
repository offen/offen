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
      'You are viewing data as <strong>operator</strong> with account <strong>%s</strong>.',
      accountName
    )
  } else {
    copy = __('You are viewing your <strong>usage data.</strong>')
  }
  return (
    <HighlightBox
      dangerouslySetInnerHTML={{ __html: copy }}
    />
  )
}

module.exports = Header
