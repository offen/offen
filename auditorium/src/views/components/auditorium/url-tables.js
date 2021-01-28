/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const Tables = require('./tables')
const ExplainerIcon = require('./explainer-icon')
const Paragraph = require('./../_shared/paragraph')

const URLTable = (props) => {
  const {
    model, showExplainer, explainerActive,
    onExplain, explainerPropsFor
  } = props
  return (
    <div class='flex-auto pa3 bg-white'>
      <div
        class={classnames('pa2', 'ma-1', explainerActive ? 'bg-light-yellow' : null)}
      >
        <h4 class='f4 normal ma0'>
          {__('Top pages')}
          {showExplainer ? <ExplainerIcon invert={explainerActive} marginLeft onclick={onExplain} /> : null}
        </h4>
        {explainerActive
          ? (
            <Paragraph class='mw7 ma0 pv2'>
              {__('This panel displays several page lists that count the total number of your page views of the <a href="#terms-offen-installation" class="%s">Offen installation</a> per URL in different categories.', 'b link dim dark-green')}
            </Paragraph>
            )
          : null}
      </div>
      <div class='mt3'>
        <Tables.Container>
          <Tables.Table
            columnNames={[__('URL'), __('Pageviews')]}
            rows={model.pages}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
          explainerPropsFor={explainerPropsFor}
          groupName='referrers'
        >
          <Tables.Table
            headline={__('Referrers')}
            columnNames={[__('Host'), __('Sessions'), __('Page depth')]}
            formatAs={['count', 'value']}
            rows={model.referrers}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> Popular referrers like, for example, Google or Twitter display their proper name, others their domain.', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
          />
          <Tables.Table
            headline={__('Campaigns')}
            columnNames={[__('Campaign'), __('Sessions'), __('Page depth')]}
            formatAs={['count', 'value']}
            rows={model.campaigns}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of special referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> <a href="#terms-operator" class="%s">Operators</a> can mark links to their pages with a campaign tag. This is used, for example, to measure the success of online advertising campaigns.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
          />
          <Tables.Table
            headline={__('Sources')}
            columnNames={[__('Source'), __('Sessions'), __('Views per session')]}
            formatAs={['count', 'value']}
            rows={model.sources}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of special referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> <a href="#terms-operator" class="%s">Operators</a> can mark links to their pages with a source tag. This is used, for example, to measure the success of online advertising campaigns.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
          explainerPropsFor={explainerPropsFor}
          groupName='landing-exit'
        >
          <Tables.Table
            headline={__('Landing pages')}
            columnNames={[__('URL'), __('Landings')]}
            rows={model.landingPages}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of pages of the <a href="#terms-offen-installation" class="%s">Offen installation</a> that you have opened first in all <a href="#terms-unique-session" class="%s">unique sessions.</a>', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
          />
          <Tables.Table
            headline={__('Exit pages')}
            columnNames={[__('URL'), __('Exits')]}
            rows={model.exitPages}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of pages of the <a href="#terms-offen-installation" class="%s">Offen installation</a> that you have opened last in all <a href="#terms-unique-session" class="%s">unique sessions.</a> For this to be counted you must have visited at least two pages.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
          />
        </Tables.Container>
      </div>
    </div>
  )
}

module.exports = URLTable
