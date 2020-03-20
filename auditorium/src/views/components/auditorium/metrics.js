/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const KeyMetric = require('./key-metric')
const ExplainerIcon = require('./explainer-icon')

const Metrics = (props) => {
  const { isOperator, model, arrangement, showExplainer, onExplain, explainerActive } = props

  const uniqueEntities = isOperator
    ? model.uniqueUsers
    : model.uniqueAccounts
  const entityName = isOperator
    ? __('users')
    : __('accounts')

  const headline = (
    <div
      class={classnames('pa1', 'ma-1', explainerActive ? 'bg-light-yellow' : null)}
    >
      <h4 class='f4 normal ma0'>
        {__('Key metrics')}
        {showExplainer ? <ExplainerIcon invert={explainerActive} onclick={onExplain} marginLeft /> : null}
      </h4>
      {explainerActive
        ? (
          <p class='ma0 pv2'>
            {__('Some text to explain what\'s going on here')}
          </p>
        )
        : null}
    </div>
  )
  const metricUniqueEntities = (
    <KeyMetric
      name={__('Unique %s', entityName)}
      value={uniqueEntities}
      formatAs='count'
    />
  )
  const metricUniqueSessions = (
    <KeyMetric
      name={__('Unique sessions')}
      value={model.uniqueSessions}
      formatAs='count'
    />
  )
  const metricAveragePageDepth = (
    <KeyMetric
      name={__('Avg. page depth')}
      value={model.avgPageDepth}
      formatAs='number'
      small
    />
  )
  const metricBounceRate = (
    <KeyMetric
      name={__('Bounce rate')}
      value={model.bounceRate}
      formatAs='percentage'
      small
    />
  )
  const metricNewUsers = (
    isOperator ? (
      <KeyMetric
        name={__('New users')}
        value={model.newUsers}
        formatAs='percentage'
        small
      />
    ) : null)
  const metricPlus = (
    isOperator && model.loss
      ? (
        <KeyMetric
          name={__('Plus')}
          value={model.loss}
          formatAs='percentage'
          small
        />
      )
      : null
  )
  const metricMobile = (
    <KeyMetric
      name={isOperator ? __('Mobile users') : __('Mobile user')}
      value={model.mobileShare}
      formatAs={isOperator ? 'percentage' : 'boolean'}
      small
    />
  )
  const metricAveragePageload = (
    <KeyMetric
      name={__('Avg. page load time')}
      value={model.avgPageload}
      formatAs='duration'
      small
    />
  )

  if (arrangement === 'horizontal') {
    return (
      <div class='pa3 bg-white flex-auto'>
        {headline}
        <div class='flex flex-wrap mv3 bb b--light-gray'>
          <div class='mb4 mr4'>
            {metricUniqueEntities}
          </div>
          <div class='mb4 mr4'>
            {metricUniqueSessions}
          </div>
        </div>
        <div class='flex flex-wrap'>
          <div class='mb4 mr4'>
            {metricAveragePageDepth}
          </div>
          <div class='mb4 mr4'>
            {metricBounceRate}
          </div>
          <div class='mb4 mr4'>
            {metricMobile}
          </div>
          <div class='mb4 mr4'>
            {metricAveragePageload}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div class='pa3 bg-white flex-auto'>
      {headline}
      <div class='flex flex-wrap mv3 bb b--light-gray'>
        <div class='w-50 w-100-ns mb4'>
          {metricUniqueEntities}
        </div>
        <div class='w-50 w-100-ns mb4'>
          {metricUniqueSessions}
        </div>
      </div>
      <div class='flex flex-wrap mb3 bb b--light-gray'>
        <div class='w-50 w-100-ns mb4'>
          {metricAveragePageDepth}
        </div>
        <div class='w-50 w-100-ns mb4'>
          {metricBounceRate}
        </div>
        <div class='w-50 w-100-ns mb4'>
          {metricNewUsers}
        </div>
        <div class='w-50 w-100-ns mb4'>
          {metricPlus}
        </div>
      </div>
      <div class='flex flex-wrap'>
        <div class='w-50 w-100-ns mb4'>
          {metricMobile}
        </div>
        <div class='w-50 w-100-ns mb4'>
          {metricAveragePageload}
        </div>
      </div>
    </div>
  )
}

module.exports = Metrics
