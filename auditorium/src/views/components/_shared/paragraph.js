/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const _ = require('underscore')

const Paragraph = (props) => {
  const { children, ...otherProps } = props
  if (!_.isString(children)) {
    return (
      <p
        {...otherProps}
      >
        {children}
      </p>
    )
  }
  return (
    <p
      {...otherProps}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  )
}

module.exports = Paragraph
