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
              dangerouslySetInnerHTML={{ __html: __('This panel displays several page lists that count the total number of your page views of the <a href="#Offen_installation" class="%s">Offen installation</a> per URL in different categories.', 'link dim dark-green') }}
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
              return __('Explaining Referrers')
            }}
          />
          <Tables.Table
            headline={__('Campaigns')}
            columnNames={[__('Campaign'), __('Pageviews')]}
            rows={model.campaigns}
            explainer={(props) => {
              return __('Explaining Campaigns')
            }}
          />
          <Tables.Table
            headline={__('Sources')}
            columnNames={[__('Source'), __('Pageviews')]}
            rows={model.sources}
            explainer={(props) => {
              return __('Explaining Sources')
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
              return __('Explaining Landing Pages')
            }}
          />
          <Tables.Table
            headline={__('Exit Pages')}
            columnNames={[__('URL'), __('Exits')]}
            rows={model.exitPages}
            explainer={(props) => {
              return __('Explaining Exit Pages')
            }}
          />
        </Tables.Container>
      </div>
    </div>
  )
}

module.exports = URLTable
