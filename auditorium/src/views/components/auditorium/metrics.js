/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const KeyMetric = require('./key-metric')
const ExplainerIcon = require('./explainer-icon')
const Paragraph = require('./../_shared/paragraph')

const ExplainerContent = (props) => {
  const { explainerActive, children } = props
  if (!explainerActive) {
    return null
  }
  return (
    <div class='bg-light-yellow pa1'>
      {children}
    </div>
  )
}

const Metrics = (props) => {
  const {
    isOperator, model, arrangement, showExplainer,
    onExplain, explainerActive, explainerPropsFor
  } = props

  const uniqueEntities = isOperator
    ? model.uniqueUsers
    : model.uniqueAccounts
  const entityName = isOperator
    ? __('users')
    : __('websites')

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
          <Paragraph class='mw7 ma0 pv2'>
            {__('This panel displays the most significant metrics at a glance.')}
          </Paragraph>
          )
        : null}
    </div>
  )

  const propsUniqueEntities = explainerPropsFor ? explainerPropsFor('metric/unique-entities') : {}
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
      <Paragraph class='mw7 ma0 ph1 pv2'>
        {__('The number of websites you have visited where the <a href="#terms-offen-installation" class="%s">Offen installation</a> is active. This value will be 1 in many cases.', 'b link dim dark-green')}
      </Paragraph>
    </ExplainerContent>
  )

  const propsUniqueSessions = explainerPropsFor ? explainerPropsFor('metric/unique-sessions') : {}
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
      <Paragraph class='mw7 ma0 ph1 pv2'>
        {__('The number of <a href="#terms-unique-session" class="%s">unique sessions</a> you have created on pages where the <a href="#terms-offen-installation" class="%s">Offen installation</a> is active.', 'b link dim dark-green', 'b link dim dark-green')}
      </Paragraph>
    </ExplainerContent>
  )

  const propsAveragePageDepth = explainerPropsFor ? explainerPropsFor('metric/avg-page-depth') : {}
  const metricAveragePageDepth = (
    <KeyMetric
      name={__('Avg. page depth')}
      value={model.avgPageDepth}
      formatAs='number'
      small
      {...propsAveragePageDepth}
    />
  )
  const explainerAveragePageDepth = (
    <ExplainerContent {...propsAveragePageDepth}>
      <Paragraph class='mw7 ma0 ph1 pv2'>
        {__('Full form: Average page depth. The average number of pages you have visited during all <a href="#terms-unique-session" class="%s">unique sessions</a> on all websites where the <a href="#terms-offen-installation" class="%s">Offen installation</a> is active.', 'b link dim dark-green', 'b link dim dark-green')}
      </Paragraph>
    </ExplainerContent>
  )

  const propsBounceRate = explainerPropsFor ? explainerPropsFor('metric/bounce-rate') : {}
  const metricBounceRate = (
    <KeyMetric
      name={__('Bounce rate')}
      value={model.bounceRate}
      formatAs='percentage'
      small
      {...propsBounceRate}
    />
  )
  const explainerBounceRate = (
    <ExplainerContent {...propsBounceRate}>
      <Paragraph class='mw7 ma0 ph1 pv2'>
        {__('The percentage of <a href="#terms-unique-session" class="%s">unique sessions</a> where you only visited one page of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> Therefore a website with only one page will always have a bounce rate of 100%.', 'b link dim dark-green', 'b link dim dark-green')}
      </Paragraph>
    </ExplainerContent>
  )

  const metricReturningUsers = (
    isOperator
      ? (
        <KeyMetric
          name={__('Returning users')}
          value={model.returningUsers}
          formatAs='percentage'
          small
        />
        )
      : null)

  const propsMobile = explainerPropsFor ? explainerPropsFor('metric/mobile') : {}
  const metricMobile = (
    <KeyMetric
      name={isOperator ? __('Mobile users') : __('Mobile user')}
      value={model.mobileShare}
      formatAs={isOperator ? 'percentage' : 'boolean'}
      small
      {...propsMobile}
    />
  )
  const explainerMobile = (
    <ExplainerContent {...propsMobile}>
      <Paragraph class='mw7 ma0 ph1 pv2'>
        {__('Shows whether you are considered to be using a mobile device. A check is made to see if your device thinks it can change its orientation. If so, it is considered mobile.')}
      </Paragraph>
    </ExplainerContent>
  )

  const propsAveragePageload = explainerPropsFor ? explainerPropsFor('metric/avg-pageload') : {}
  const metricAveragePageload = (
    <KeyMetric
      name={__('Avg. page load time')}
      value={model.avgPageload}
      formatAs='duration'
      small
      {...propsAveragePageload}
    />
  )
  const explainerAveragePageload = (
    <ExplainerContent {...propsAveragePageload}>
      <Paragraph class='mw7 ma0 ph1 pv2'>
        {__('Full form: Average page load time. The average time it took for all pages of the <a href="#terms-offen-installation" class="%s">Offen installation</a> you visited to become interactive.', 'b link dim dark-green')}
      </Paragraph>
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
          <div class='w-100'>
            {explainerUniqueEntities}
            {explainerUniqueSessions}
          </div>
        </div>
        <div class='flex flex-wrap justify-between justify-start-ns'>
          <div class='order-0 ml2 mr4'>
            {metricAveragePageDepth}
          </div>
          <div class='order-1 mr2 mr4-ns'>
            {metricBounceRate}
          </div>
          <div class='order-2 order-2-m order-5-l w-100 mb4 mb0-l'>
            {explainerAveragePageDepth}
            {explainerBounceRate}
          </div>
          <div class='ml2 order-3 mr4'>
            {metricMobile}
          </div>
          <div class='ml2 order-4 mr2 mr4-ns'>
            {metricAveragePageload}
          </div>
          <div class='order-6 w-100 mb4'>
            {explainerMobile}
            {explainerAveragePageload}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div class='pa2 bg-white flex-auto'>
      {headline}
      <div class='flex flex-wrap mv3 bb b--light-gray'>
        <div class='w-50 w-100-ns mb4 pl2'>
          {metricUniqueEntities}
        </div>
        <div class='w-50 w-100-ns mb4 pl2'>
          {metricUniqueSessions}
        </div>
      </div>
      <div class='flex flex-wrap mb4 bb b--light-gray'>
        <div class='w-50 w-100-ns mb4 pl2'>
          {metricAveragePageDepth}
        </div>
        <div class='w-50 w-100-ns mb4 pl2'>
          {metricBounceRate}
        </div>
        <div class='w-50 w-100-ns mb4 pl2'>
          {metricReturningUsers}
        </div>
      </div>
      <div class='flex flex-wrap'>
        <div class='w-50 w-100-ns mb4 pl2'>
          {metricMobile}
        </div>
        <div class='w-50 w-100-ns mb4 pl2'>
          {metricAveragePageload}
        </div>
      </div>
    </div>
  )
}

module.exports = Metrics
