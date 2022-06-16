/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const LocalizedAnchor = (props) => {
  const { children, href, lang, ...rest } = props

  let updatedHref = href
  if (lang) {
    let isFullUrl = false
    try {
      new window.URL(href) // eslint-disable-line no-new
      isFullUrl = true
    } catch (err) {}

    const localizedHref = isFullUrl
      ? new window.URL(href)
      : new window.URL(href, window.location.origin)

    localizedHref.searchParams.set('lang', lang)
    updatedHref = localizedHref.toString()
  }

  return (
    <a
      href={updatedHref}
      {...rest}
    >
      {children}
    </a>
  )
}

module.exports = connect(props => ({ lang: props.queryParams.lang }))(LocalizedAnchor)
