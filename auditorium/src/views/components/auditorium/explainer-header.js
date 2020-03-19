/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const ExplainerIcon = require('./explainer-icon')

module.exports = (props) => {
  return (
    <div class='pa3 bg-white w-100'>
      <ExplainerIcon
        marginRight
      />
      <p class='ma0 dib'>
        {__('Click this symbol to display an explanation of the metric.')}
      </p>
    </div>
  )
}
