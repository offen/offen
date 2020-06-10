/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const Format = require('./format')
const ExplainerIcon = require('./explainer-icon')

const KeyMetric = (props) => {
  const { value, name, small, formatAs, showExplainer, onExplain, explainerActive } = props
  return (
    <p class='ma0 pa0'>
      <span class={classnames('db mt0 mb2', { f2: !small }, { f3: small })}>
        <Format formatAs={formatAs}>
          {value}
        </Format>
      </span>
      <span class={classnames('db ma-1 pa2 pb3 normal', { 'bg-light-yellow': explainerActive })}>
        {name}
        {showExplainer ? <ExplainerIcon invert={explainerActive} marginLeft onclick={onExplain} /> : null}
      </span>
    </p>
  )
}

module.exports = KeyMetric
