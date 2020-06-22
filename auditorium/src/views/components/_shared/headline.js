/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Headline = (props) => {
  const { children, level, ...otherProps } = props
  switch (level) {
    case 1:
      return (
        <h1
          {...otherProps}
          dangerouslySetInnerHTML={{ __html: children }}
        />
      )
    case 2:
      return (
        <h2
          {...otherProps}
          dangerouslySetInnerHTML={{ __html: children }}
        />
      )
    case 3:
      return (
        <h3
          {...otherProps}
          dangerouslySetInnerHTML={{ __html: children }}
        />
      )
    case 4:
      return (
        <h4
          {...otherProps}
          dangerouslySetInnerHTML={{ __html: children }}
        />
      )
    case 5:
      return (
        <h5
          {...otherProps}
          dangerouslySetInnerHTML={{ __html: children }}
        />
      )
    case 6:
      return (
        <h5
          {...otherProps}
          dangerouslySetInnerHTML={{ __html: children }}
        />
      )
    default:
      return null
  }
}

module.exports = Headline
