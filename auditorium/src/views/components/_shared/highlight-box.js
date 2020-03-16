/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const HighlightBox = (props) => {
  const { children, ...otherProps } = props
  return (
    <p class='dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow' {...otherProps}>
      {children}
    </p>
  )
}

module.exports = HighlightBox
