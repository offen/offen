/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const LoadingOverlay = (props) => {
  return (
    <div class='fixed top-0 right-0 bottom-0 left-0 bg-white o-40' />
  )
}

module.exports = LoadingOverlay
