/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')
const classnames = require('classnames')

const ExplainerIcon = require('./explainer-icon')
const DatePicker = require('./date-picker')
const ForwardingAnchor = require('./../_shared/forwarding-anchor')

// possible values for `retentionPeriod` are:
// `6months`, '12weeks', '6weeks', '30days', '7days'

const predefinedRanges = [
  { display: __('Yesterday'), query: { range: 'yesterday', resolution: 'hours' }, endsFirstBlock: true },
  { display: __('24 hours'), query: { range: '24', resolution: 'hours' }, opensSecondBlock: true },
  { display: __('7 days'), query: null },
  { display: __('30 days'), query: { range: '30', resolution: 'days' }, configured: (r) => ['6months', '12weeks', '6weeks', '30days'].indexOf(r) !== -1 },
  { display: __('6 weeks'), query: { range: '6', resolution: 'weeks' }, configured: (r) => ['6months', '12weeks', '6weeks'].indexOf(r) !== -1 },
  { display: __('12 weeks'), query: { range: '12', resolution: 'weeks' }, configured: (r) => ['6months', '12weeks'].indexOf(r) !== -1 },
  { display: __('6 months'), query: { range: '6', resolution: 'months' }, endsSecondBlock: true, configured: (r) => ['6months'].indexOf(r) !== -1 }
]

const RangeSelector = (props) => {
  const {
    resolution, range: currentRange, showExplainer, onExplain, explainerActive,
    from, to, queryParams, retentionPeriod = '6months'
  } = props

  const [showDatepicker, setShowDatepicker] = useState(false)

  const items = predefinedRanges.map(function (range, index) {
    const isConfigured = 'configured' in range
      ? range.configured(retentionPeriod)
      : true
    const url = window.location.pathname
    const activeRange = !from && !to &&
      JSON.stringify({ range: currentRange, resolution }) === JSON.stringify(range.query || {})

    return (
      <li
        key={`fixed-range-${index}`}
        class={classnames(
          'pr3 bt b--light-gray',
          range.opensSecondBlock ? 'fixed-ranges-start pl4-ns' : null,
          range.endsFirstBlock ? 'br-ns' : null,
          range.endsSecondBlock ? 'pr4' : null
        )}
      >
        {(() => {
          if (!isConfigured) {
            return (
              <span
                class='moon-gray b link dim dib mb2 mr1 pv2 ph1 mt1'
                title={__('Not available')}
              >
                {range.display}
              </span>
            )
          }
          return (
            <ForwardingAnchor
              href={url}
              values={range.query}
              skip={['from', 'to', ...(range.query ? [] : ['range', 'resolution'])]}
              class={activeRange
                ? 'dark-green b link dim dib mb2 mr1 pv2 ph1 bt bw2 b--dark-green'
                : 'dark-green b link dim dib mb2 mr1 pv2 ph1 mt1'}
              aria-current={activeRange ? 'time' : null}
              onclick={() => setShowDatepicker(false)}
            >
              {range.display}
            </ForwardingAnchor>
          )
        })()}
      </li>
    )
  })

  items.push((() => {
    const isActive = from && to
    return (
      <li key='custom-daterange' class='datepicker-display bt b--light-gray pr3'>
        <span
          class={isActive
            ? 'pointer dark-green b link dim dib mb2 mr1 pv2 ph1 bt bw2 b--dark-green'
            : 'pointer dark-green b link dim dib mb2 mr1 pv2 ph1 mt1'}
          aria-current={isActive ? 'time' : null}
          role='button'
          tabindex='0'
          onkeypress={(e) => {
            if (e.which === 13) {
              setShowDatepicker(!showDatepicker)
            }
          }}
          onclick={() => setShowDatepicker(!showDatepicker)}
        >
          {__('Custom')}
          <span class={classnames(
            'ml4 dib label-toggle',
            showDatepicker ? null : 'label-toggle--rotate'
          )}
          />
        </span>
      </li>
    )
  })())

  return (
    <div class='pa3 bg-white flex-auto'>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media screen and (min-width: 30em) {
            .fixed-ranges-start::before {
              content: '${__('Last')}';
              display: inline-block;
              margin-right: 1.5em;
            }
          }
        `
        }}
      />
      <div
        class={classnames('pa2', 'ma-1', explainerActive ? 'bg-light-yellow' : null)}
      >
        <h4 class='f4 normal ma0'>
          {__('Show data from')}
          {showExplainer
            ? (
              <ExplainerIcon
                onclick={onExplain}
                invert={explainerActive}
                marginLeft
              />
            )
            : null}
        </h4>
        {explainerActive
          ? (
            <p class='mw7 ma0 pv2'>
              {__('Here you can set the time frame for all displayed metrics. As all data is generally deleted after 6 months maximum, the selection is limited to this duration.')}
            </p>
          )
          : null}
      </div>
      <ul class='flex flex-wrap list pa0 mh0 mt3 mb3 grow-list b--light-gray'>
        {items}
      </ul>
      {showDatepicker
        ? (
          <DatePicker
            queryParams={queryParams}
            from={from}
            to={to}
            retentionPeriod={retentionPeriod}
            onClose={() => setShowDatepicker(false)}
          />
        )
        : null}
    </div>
  )
}

module.exports = RangeSelector
