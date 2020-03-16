/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const withTitle = require('./components/_shared/with-title')
const withLayout = require('./components/_shared/with-layout')
const HighlightBox = require('./components/_shared/highlight-box')

const NotFoundView = () => (
  <HighlightBox>
    {__('Not found...')}
  </HighlightBox>
)

module.exports = withLayout()(
  withTitle('Not Found | Offen')(
    NotFoundView
  )
)
