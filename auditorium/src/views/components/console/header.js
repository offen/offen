/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const HighlightBox = require('./../_shared/highlight-box')

const Header = (props) => {
  return (
    <HighlightBox
      dangerouslySetInnerHTML={{
        __html: __(
          'You are logged in as operator.'
        )
      }}
    />
  )
}

module.exports = Header
