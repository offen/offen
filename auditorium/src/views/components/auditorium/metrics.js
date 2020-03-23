/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const KeyMetric = require('./key-metric')
const ExplainerIcon = require('./explainer-icon')

const ExplainerContent = (props) => {
  const { explainerActive, children } = props
  if (!explainerActive) {
    return null
  }
  return (
    <div class='bg-light-yellow w-100 pa1'>
      <p class='ma0 ph1 pv2'>
        {children}
      </p>
    </div>
  )
}

const Metrics = (props) => {
  const { isOperator, model, arrangement, showExplainer, onExplain, explainerActive, explainerProps = () => ({}) } = props

  const uniqueEntities = isOperator
    ? model.uniqueUsers
    : model.uniqueAccounts
  const entityName = isOperator
    ? __('users')
    : __('accounts')

  const headline = (
    <div
      class={classnames('pa2', explainerActive ? 'bg-light-yellow' : null)}
    >
      <h4 class='f4 normal ma0'>
        {__('Key metrics')}
        {showExplainer ? <ExplainerIcon invert={explainerActive} onclick={onExplain} marginLeft /> : null}
      </h4>
      {explainerActive
        ? (
          <p class='mw7 ma0 pv2'>
            {__('This panel displays the most significant metrics at a glance.')}
          </p>
        )
        : null}
    </div>
  )

  const propsUniqueEntities = explainerProps('metric/unique-entities')
  const metricUniqueEntities = (
    <KeyMetric
      name={__('Unique %s', entityName)}
      value={uniqueEntities}
      formatAs='count'
      {...propsUniqueEntities}
    />
  )
  const explainerUniqueEntities = (
    <ExplainerContent {...propsUniqueEntities}>
      {__('Explaining unique accounts')}
    </ExplainerContent>
  )

  const propsUniqueSessions = explainerProps('metric/unique-sessions')
  const metricUniqueSessions = (
    <KeyMetric
      name={__('Unique sessions')}
      value={model.uniqueSessions}
      formatAs='count'
      {...propsUniqueSessions}
    />
  )
  const explainerUniqueSessions = (
    <ExplainerContent {...propsUniqueSessions}>
      {__('Explaining unique sessions')}
    </ExplainerContent>
  )

  const metricAveragePageDepth = (
    <KeyMetric
      name={__('Avg. page depth')}
      value={model.avgPageDepth}
      formatAs='number'
      small
      {...explainerProps('metric/avg-page-depth')}
    />
  )
  const explainerAveragePageDepth = (
    <ExplainerContent {...explainerProps('metric/avg-page-depth')}>
      {__('Explaining average page depth')}
    </ExplainerContent>
  )

  const metricBounceRate = (
    <KeyMetric
      name={__('Bounce rate')}
      value={model.bounceRate}
      formatAs='percentage'
      small
      {...explainerProps('metric/bounce-rate')}
    />
  )
  const explainerBounceRate = (
    <ExplainerContent {...explainerProps('metric/bounce-rate')}>
      {__('Explaining bounce rate')}
    </ExplainerContent>
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
      {...explainerProps('metric/mobile')}
    />
  )
  const explainerMobile = (
    <ExplainerContent {...explainerProps('metric/mobile')}>
      {__('Explaining mobile user')}
    </ExplainerContent>
  )

  const metricAveragePageload = (
    <KeyMetric
      name={__('Avg. page load time')}
      value={model.avgPageload}
      formatAs='duration'
      small
      {...explainerProps('metric/avg-pageload')}
    />
  )
  const explainerAveragePageload = (
    <ExplainerContent {...explainerProps('metric/avg-pageload')}>
      {__('Explaining average pageload')}
    </ExplainerContent>
  )

  if (arrangement === 'horizontal') {
    return (
      <div class='pa2 bg-white flex-auto'>
        {headline}
        <div class='flex flex-wrap justify-between justify-start-ns mv3 pb4 bb b--light-gray'>
          <div class='ml2 mr4 mb1'>
            {metricUniqueEntities}
          </div>
          <div class='mb1 mr2'>
            {metricUniqueSessions}
          </div>
          {explainerUniqueEntities}
          {explainerUniqueSessions}
        </div>
        <div class='flex flex-wrap'>
          <div class='mb1 mr4'>
            {metricAveragePageDepth}
          </div>
          <div class='mb1 mr4'>
            {metricBounceRate}
          </div>
          <div class='mb1 mr4'>
            {metricMobile}
          </div>
          <div class='mb1 mr4'>
            {metricAveragePageload}
          </div>
          {explainerAveragePageDepth}
          {explainerBounceRate}
          {explainerMobile}
          {explainerAveragePageload}
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
