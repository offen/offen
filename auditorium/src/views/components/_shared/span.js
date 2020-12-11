/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Span = (props) => {
  const { children, ...otherProps } = props
  return (
    <span
      {...otherProps}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  )
}

module.exports = Span
