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
  const { model, showExplainer, explainerActive, onExplain } = props
  return (
    <div class='flex-auto pa3 bg-white'>
      <div
        class={classnames('pa1', 'ma-1', explainerActive ? 'bg-light-yellow' : null)}
      >
        <h4 class='f4 normal ma0'>
          {__('Top pages')}
          {showExplainer ? <ExplainerIcon invert={explainerActive} marginLeft onclick={onExplain} /> : null}
        </h4>
        {explainerActive
          ? (
            <p class='ma0 pv2'>
              {__('Some text to explain what\'s going on here')}
            </p>
          )
          : null}
      </div>
      <div class='mt3'>
        <Tables.Container
          showExplainer={showExplainer}
        >
          <Tables.Table
            columnNames={[__('URL'), __('Pageviews')]}
            rows={model.pages}
            showExplainer={showExplainer}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
        >
          <Tables.Table
            headline={__('Referrers')}
            columnNames={[__('Host'), __('Pageviews')]}
            rows={model.referrers}
          />
          <Tables.Table
            headline={__('Campaigns')}
            columnNames={[__('Campaign'), __('Pageviews')]}
            rows={model.campaigns}
          />
          <Tables.Table
            headline={__('Sources')}
            columnNames={[__('Source'), __('Pageviews')]}
            rows={model.sources}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
        >
          <Tables.Table
            headline={__('Landing Pages')}
            columnNames={[__('URL'), __('Landings')]}
            rows={model.landingPages}
          />
          <Tables.Table
            headline={__('Exit Pages')}
            columnNames={[__('URL'), __('Exits')]}
            rows={model.exitPages}
          />
        </Tables.Container>
      </div>
    </div>
  )
}

module.exports = URLTable
