/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const classnames = require('classnames')

const Format = require('./format')
const ExplainerIcon = require('./explainer-icon')

const KeyMetric = (props) => {
  const { value, name, small, formatAs, showExplainer, onExplain, explainerActive } = props
  return (
    <Fragment>
      <p class={classnames('mt0 mb2', { f2: !small }, { f3: small })}>
        <Format formatAs={formatAs}>
          {value}
        </Format>
      </p>
      <p class={classnames('ma-1 pa2 pb3 normal', { 'bg-light-yellow': explainerActive })}>
        {name}
        {showExplainer ? <ExplainerIcon invert={explainerActive} marginLeft onclick={onExplain} /> : null}
      </p>
    </Fragment>
  )
}

module.exports = KeyMetric
