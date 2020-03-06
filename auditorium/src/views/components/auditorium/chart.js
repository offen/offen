/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

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
  const { model, isOperator, resolution } = props
  const { pageviews } = model
  const x = pageviews.map(function (item) {
    return item.date
  })
  const yVisitors = pageviews.map(function (item) {
    return isOperator
      ? item.visitors
      : item.accounts
  })
  const yPageviews = pageviews.map(function (item, index) {
    return item.pageviews - yVisitors[index]
  })
  const yTotal = yVisitors.map(function (item, index) {
    return item + yPageviews[index]
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
      y: yVisitors,
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
      y: yPageviews,
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
    dragmode: false,
    autosize: true,
    yaxis: {
      fixedrange: true,
      dtick: 1,
      // this is needed to ensure plotly does not display decimal ticks
      // on very low pageview counts
      nticks: Math.min(5, (Math.max.apply(Math, yTotal) + 1)),
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
    <div class='flex flex-column flex-auto pa3 bg-white'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Page views and %s', isOperator ? __('visitors') : __('accounts'))}
      </h4>
      <div class='mb4 chart flex-auto'>
        {yTotal.some((v) => v > 0)
          ? (
            <Plot
              data={data}
              layout={layout}
              config={config}
              style={{
                width: '100%',
                height: '100%'
              }}
              useResizeHandler
            />
          )
          : (
            <h4>{__("We don't have any data to display for the selected time range.")}</h4>
          )}
      </div>
    </div>
  )
}

module.exports = memo(
  Chart,
  (prevProps, nextProps) => {
    const prevPageviews = prevProps.model.pageviews.map((p) => _.omit(p, 'date'))
    const nextPageviews = nextProps.model.pageviews.map((p) => _.omit(p, 'date'))
    return _.isEqual(prevPageviews, nextPageviews)
  }
)
