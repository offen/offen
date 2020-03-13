/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const KeyMetric = require('./key-metric')

const RowMetrics = (props) => {
  const { isOperator, model } = props

  const uniqueEntities = isOperator
    ? model.uniqueUsers
    : model.uniqueAccounts
  const entityName = isOperator
    ? __('users')
    : __('accounts')

  return (
    <div class='pa3 bg-white flex-auto'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Key metrics')}
      </h4>
      <div class='flex flex-wrap mb3 bb b--light-gray'>
        <KeyMetric
          name={__('Unique %s', entityName)}
          value={uniqueEntities}
          formatAs='count'
        />
        <KeyMetric
          name={__('Unique sessions')}
          value={model.uniqueSessions}
          formatAs='count'
        />
      </div>
      <div class='flex flex-wrap mb3 bb b--light-gray'>
        <KeyMetric
          name={__('Avg. page depth')}
          value={model.avgPageDepth}
          formatAs='number'
          small
        />
        <KeyMetric
          name={__('Bounce rate')}
          value={model.bounceRate}
          formatAs='percentage'
          small
        />
        {isOperator ? (
          <KeyMetric
            name={__('New users')}
            value={model.newUsers}
            formatAs='percentage'
            small
          />
        ) : null}
        {isOperator && model.loss
          ? (
            <KeyMetric
              name={__('Plus')}
              value={model.avgPageDepth}
              formatAs='percentage'
              small
            />
          )
          : null}
      </div>
      <div class='flex flex-wrap'>
        <KeyMetric
          name={isOperator ? __('Mobile users') : __('Mobile user')}
          value={model.mobileShare}
          formatAs={isOperator ? 'percentage' : 'boolean'}
          small
        />
        <KeyMetric
          name={__('Avg. page load time')}
          value={model.avgPageload}
          formatAs='duration'
          small
        />
      </div>
    </div>
  )
}

module.exports = RowMetrics
