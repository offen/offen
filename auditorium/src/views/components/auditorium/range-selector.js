/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')
const classnames = require('classnames')

const ExplainerIcon = require('./explainer-icon')
const DatePicker = require('./date-picker')

const RangeSelector = (props) => {
  const {
    resolution, range: currentRange, showExplainer, onExplain, explainerActive,
    from, to
  } = props

  const [showDatepicker, setShowDatepicker] = useState(false)

  const ranges = [
    { display: __('Yesterday'), query: { range: 'yesterday', resolution: 'hours' } },
    { display: __('Last 24 hours'), query: { range: '24', resolution: 'hours' } },
    { display: __('Last 7 days'), query: null },
    { display: __('Last 30 days'), query: { range: '30', resolution: 'days' } },
    { display: __('All time'), query: { range: '6', resolution: 'months' } }
  ]

  const items = ranges.map(function (range, index) {
    let url = window.location.pathname
    const activeRange = !from && !to &&
      JSON.stringify({ range: currentRange, resolution }) === JSON.stringify(range.query || {})

    if (range.query) {
      url += '?' + new window.URLSearchParams(range.query)
    }
    var anchorRange = (
      <a
        onclick={() => setShowDatepicker(false)}
        href={url}
        class='b link dim dib pv2 dark-green mt1 mb2 mr3'
      >
        {range.display}
      </a>
    )

    return (
      <li key={index} class='pr3 bt b--light-gray'>
        {activeRange
          ? (
            <a
              href={url}
              class='b link dim dib bt bw2 b--dark-green ph2 pv2 mb2 mr3 dark-green'
              aria-current='time'
              onclick={() => setShowDatepicker(false)}
            >
              {range.display}
            </a>
          )
          : anchorRange}
      </li>
    )
  })

  items.push((() => {
    const isActive = from && to
    return (
      <li key='custom-daterange' class='datepicker-display pr3 bt b--light-gray'>
        <span
          class={isActive
            ? 'b link dim dib bt bw2 b--dark-green ph2 pv2 mb2 mr3 dark-green'
            : 'b dim dib pv2 dark-green mt1 mb2 mr3 pointer'}
          aria-current='time'
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
              {__('Here you can set the time frame for all displayed metrics. As all data is generally deleted after 6 months, the selection is limited to this duration.')}
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
            from={from}
            to={to}
            onClose={() => setShowDatepicker(false)}
          />
        )
        : null}
    </div>
  )
}

module.exports = RangeSelector
