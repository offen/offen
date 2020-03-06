/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useEffect } = require('preact/hooks')

const withTitle = (title) => (OriginalComponent) => {
  const WrappedComponent = (props) => {
    useEffect(() => {
      document.title = title
    }, [])
    return <OriginalComponent {...props} />
  }
  return WrappedComponent
}

module.exports = withTitle
