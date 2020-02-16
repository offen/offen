/** @jsx h */
const { h } = require('preact')
const { memo } = require('preact/compat')
const Plotly = require('plotly.js-basic-dist')
const createPlotlyComponent = require('react-plotly.js/factory').default
const isFirstDayOfMonth = require('date-fns/is_first_day_of_month')
const isWeekend = require('date-fns/is_weekend')
const getISOWeek = require('date-fns/get_iso_week')
const getHours = require('date-fns/get_hours')
const _ = require('underscore')

const Plot = createPlotlyComponent(Plotly)

const Chart = (props) => {
  const { pageviews, isOperator, resolution } = props
  const x = pageviews.map(function (item) {
    return item.date
  })
  const y = pageviews.map(function (item) {
    return isOperator
      ? item.visitors
      : item.accounts
  })
  const text = x.map(function (value, index) {
    const date = new Date(value)
    switch (resolution) {
      case 'hours':
        return getHours(date) + ':00'
      case 'weeks':
        return 'W' + getISOWeek(date)
      case 'months':
        return date.toLocaleDateString(process.env.LOCALE, { month: 'short' })
      default:
        var result = date.toLocaleDateString(process.env.LOCALE, { day: 'numeric' })
        if (index === 0 || isFirstDayOfMonth(date)) {
          result = date.toLocaleDateString(process.env.LOCALE, { month: 'short' }) + ' ' + result
        }
        return result
    }
  })

  const data = [
    {
      type: 'bar',
      x: x,
      y: y,
      hoverinfo: 'y',
      marker: {
        color: x.map(function (date) {
          if (resolution !== 'days') {
            return '#137752'
          }
          return isWeekend(date) ? '#19A974' : '#137752'
        })
      },
      name: isOperator ? 'Visitors' : 'Accounts'
    },
    {
      type: 'bar',
      x: x,
      y: pageviews.map(function (item, index) {
        return item.pageviews - y[index]
      }),
      text: pageviews.map(function (item) {
        return item.pageviews
      }),
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        color: x.map(function (date) {
          if (resolution !== 'days') {
            return '#19A974'
          }
          return isWeekend(date) ? '#9eebcf' : '#19A974'
        })
      },
      name: 'Pageviews'
    }
  ]

  const layout = {
    autosize: true,
    yaxis: {
      fixedrange: true,
      dtick: 1,
      nticks: 5,
      automargin: true,
      autotick: true,
      tick0: 0
    },
    xaxis: {
      fixedrange: true,
      automargin: true,
      tickvals: x,
      ticktext: text
    },
    margin: { t: 0, r: 0, b: 0, l: 0 },
    barmode: 'stack',
    showlegend: false
  }

  const config = {
    displayModeBar: false,
    responsive: true
  }

  return (
    <div class='mb4 chart flex-auto'>
      <Plot
        data={data}
        layout={layout}
        config={config}
      />
    </div>
  )
}

module.exports = memo(
  Chart,
  (prevProps, nextProps) => {
    return _.isEqual(prevProps, nextProps)
  }
)
