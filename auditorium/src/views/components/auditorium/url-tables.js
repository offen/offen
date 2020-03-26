/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const Tables = require('./tables')
const ExplainerIcon = require('./explainer-icon')

const URLTable = (props) => {
  const { model, showExplainer, explainerActive, onExplain, explainerProps } = props
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
            <p
              class='mw7 ma0 pv2'
              dangerouslySetInnerHTML={{ __html: __('This panel displays several page lists that count the total number of your page views of the <a href="#terms-offen-installation" class="%s">Offen installation</a> per URL in different categories.', 'link dim dark-green') }}
            />
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
          explainerProps={explainerProps}
          groupName='referrers'
        >
          <Tables.Table
            headline={__('Referrers')}
            columnNames={[__('Host'), __('Pageviews')]}
            rows={model.referrers}
            explainer={(props) => {
              return (
                <p
                  class='mw7 ma0 ph1 pv2 ws-normal'
                  dangerouslySetInnerHTML={{ __html: __('A list of referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> Popular referrers like, for example, Google or Twitter display their proper name, others their domain.', 'link dim dark-green') }}
                />
              )
            }}
          />
          <Tables.Table
            headline={__('Campaigns')}
            columnNames={[__('Campaign'), __('Pageviews')]}
            rows={model.campaigns}
            explainer={(props) => {
              return (
                <p
                  class='mw7 ma0 ph1 pv2 ws-normal'
                  dangerouslySetInnerHTML={{ __html: __('A list of special referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> <a href="#terms-operator" class="%s">Operators</a> can mark links to their pages with a campaign tag. This is used, for example, to measure the success of online advertising campaigns.', 'link dim dark-green', 'link dim dark-green') }}
                />
              )
            }}
          />
          <Tables.Table
            headline={__('Sources')}
            columnNames={[__('Source'), __('Pageviews')]}
            rows={model.sources}
            explainer={(props) => {
              return (
                <p
                  class='mw7 ma0 ph1 pv2 ws-normal'
                  dangerouslySetInnerHTML={{ __html: __('A list of special referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> <a href="#terms-operator" class="%s">Operators</a> can mark links to their pages with a source tag. This is used, for example, to measure the success of online advertising campaigns.', 'link dim dark-green', 'link dim dark-green') }}
                />
              )
            }}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
          explainerProps={explainerProps}
          groupName='landing-exit'
        >
          <Tables.Table
            headline={__('Landing Pages')}
            columnNames={[__('URL'), __('Landings')]}
            rows={model.landingPages}
            explainer={(props) => {
              return (
                <p
                  class='mw7 ma0 ph1 pv2 ws-normal'
                  dangerouslySetInnerHTML={{ __html: __('A list of pages of the <a href="#terms-offen-installation" class="%s">Offen installation</a> that you have opened first in all <a href="#terms-unique-session" class="%s">unique sessions.</a>', 'link dim dark-green', 'link dim dark-green') }}
                />
              )
            }}
          />
          <Tables.Table
            headline={__('Exit Pages')}
            columnNames={[__('URL'), __('Exits')]}
            rows={model.exitPages}
            explainer={(props) => {
              return (
                <p
                  class='mw7 ma0 ph1 pv2 ws-normal'
                  dangerouslySetInnerHTML={{ __html: __('A list of pages of the <a href="#terms-offen-installation" class="%s">Offen installation</a> that you have opened last in all <a href="#terms-unique-session" class="%s">unique sessions.</a> For this to be counted you must have visited at least two pages.', 'link dim dark-green', 'link dim dark-green') }}
                />
              )
            }}
          />
        </Tables.Container>
      </div>
    </div>
  )
}

module.exports = URLTable
