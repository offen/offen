/** @jsx h */
const { h } = require('preact')
const _ = require('underscore')

const RangeSelector = (props) => {
  const { matches } = props
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
    const current = _.pick(matches, ['range', 'resolution'])
    const activeRange = _.isEqual(current, range.query || {})
    const foreign = _.omit(matches, ['range', 'resolution', 'accountId'])
    if (range.query || Object.keys(foreign).length) {
      url += '?' + new window.URLSearchParams(Object.assign(foreign, range.query))
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
            <a href={url} class='b link dim dib bt bw2 b--dark-green pv2 mb2 mr3 dark-green'>
              {range.display}
            </a>
          )
          : anchorRange}
      </li>
    )
  })

  return (
    <div class='w-100 bt ba-ns b--black-10 br0 br2-ns pa3 mb2-ns bg-white'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Show data from the last')}
      </h4>
      <ul class='flex flex-wrap list pa0 ma0 mb3 grow-list b--light-gray'>
        {items}
      </ul>
    </div>
  )
}

module.exports = RangeSelector
