/**
 * Copyright 2024 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const ForwardingAnchor = (props) => {
  const {
    children,
    href = window.location.pathname,
    queryParams,
    values = {},
    skip = [],
    ...rest
  } = props

  return (
    <a
      href={forward(href, queryParams, values, skip)}
      {...rest}
    >
      {children}
    </a>
  )
}

function forward (href, queryParams, values = {}, skip = []) {
  let updatedHref = href
  if (queryParams) {
    let isFullUrl = false
    try {
      new window.URL(href) // eslint-disable-line no-new
      isFullUrl = true
    } catch (err) {}

    const forwardedHref = isFullUrl
      ? new window.URL(href)
      : new window.URL(href, window.location.origin)

    for (const key in queryParams) {
      forwardedHref.searchParams.set(key, queryParams[key])
    }

    for (const key of skip) {
      forwardedHref.searchParams.delete(key)
    }

    for (const key in values) {
      forwardedHref.searchParams.set(key, values[key])
    }

    updatedHref = forwardedHref.toString()
  }
  return updatedHref
}

ForwardingAnchor.forward = forward

module.exports = connect(props => ({ queryParams: props.queryParams }))(ForwardingAnchor)