/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const LoadingOverlay = (props) => {
  return (
    <div class='delay-overlay'>
      <div class='fixed top-0 right-0 bottom-0 left-0 flex items-center z-2'>
        <div class='loading-overlay' />
      </div>
      <div class='fixed top-0 right-0 bottom-0 left-0 bg-white o-70 flex items-center z-1' />
    </div>
  )
}

module.exports = LoadingOverlay
