/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const ExplainerIcon = require('./explainer-icon')

const RangeSelector = (props) => {
  const { resolution, range: currentRange, showExplainer, onExplain, explainerActive } = props
  const ranges = [
    { display: __('24 hours'), query: { range: '24', resolution: 'hours' } },
    { display: __('7 days'), query: null },
    { display: __('28 days'), query: { range: '28', resolution: 'days' } },
    { display: __('6 weeks'), query: { range: '6', resolution: 'weeks' } },
    { display: __('12 weeks'), query: { range: '12', resolution: 'weeks' } },
    { display: __('6 months'), query: { range: '6', resolution: 'months' } }
  ]

  const items = ranges.map(function (range, index) {
    let url = window.location.pathname
    const activeRange = JSON.stringify({ range: currentRange, resolution }) === JSON.stringify(range.query || {})
    if (range.query) {
      url += '?' + new window.URLSearchParams(range.query)
    }
    var anchorRange = (
      <a href={url} class='link dim dib pv2 dark-green mt1 mb2 mr3'>
        {range.display}
      </a>
    )

    return (
      <li key={index} class='pr3 bt b--light-gray'>
        {activeRange
          ? (
            <a href={url} class='b link dim dib bt bw2 b--dark-green ph2 pv2 mb2 mr3 dark-green'>
              {range.display}
            </a>
          )
          : anchorRange}
      </li>
    )
  })

  return (
    <div class='pa3 bg-white flex-auto'>
      <div
        class={classnames('pa2', 'ma-1', explainerActive ? 'bg-light-yellow' : null)}
      >
        <h4 class='f4 normal ma0'>
          {__('Show data from the last')}
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
    </div>
  )
}

module.exports = RangeSelector
