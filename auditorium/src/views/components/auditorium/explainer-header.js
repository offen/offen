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
      <ExplainerIcon />
      <p class='dib ma0 ml2-ns mt2 mt0-ns'>
        {__('Click this symbol to display an explanation of a metric.')}
      </p>
    </div>
  )
}
