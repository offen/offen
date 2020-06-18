/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const HighlightBox = require('./../_shared/highlight-box')

module.exports = (props) => {
  if (props.consentStatus) {
    const text = props.consentStatus === 'allow'
      ? __('You are opted in.')
      : __('You are opted out.')
    return (
      <HighlightBox
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  } else if (!props.allowsCookies) {
    return (
      <HighlightBox
        dangerouslySetInnerHTML={{
          __html: __('It seems like your browser is blocking cookies.')
        }}
      />
    )
  }
  return null
}
