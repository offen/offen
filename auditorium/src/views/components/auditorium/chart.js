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
const classnames = require('classnames')

const ExplainerIcon = require('./explainer-icon')

const Plot = createPlotlyComponent(Plotly)

const tickColorFade = '#CCCCCC'
const barColorVisitors = '#137752'
const barColorVisitorsFade = '#19A974'
const barColorViews = '#19A974'
const barColorViewsFade = '#9EEBCF'

const Chart = (props) => {
  const { model, isOperator, showExplainer, onExplain, explainerActive, resolution = 'days' } = props
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
        if (isWeekend(date)) {
          return `<span style="font-weight: bold; color: ${tickColorFade}">${result}</span>`
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
            return barColorVisitors
          }
          return isWeekend(date) ? barColorVisitorsFade : barColorVisitors
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
            return barColorViews
          }
          return isWeekend(date) ? barColorViewsFade : barColorViews
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
      <div
        class={classnames('pa2', 'ma-1', explainerActive ? 'bg-light-yellow' : null)}
      >
        <h4 class='f4 normal ma0'>
          {__('Page views and %s', isOperator ? __('users') : __('websites'))}
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
            <p
              class='mw7 ma0 pv2'
              dangerouslySetInnerHTML={{ __html: __('This panel displays the number of pages (bright green) and websites (dark green) you have visited where the <a href="#terms-offen-installation" class="%s">Offen installation</a> is active. To measure this, a cookie is used to assign you a user and a session <a href="#terms-id" class="%s">ID.</a>', 'link dim dark-green', 'link dim dark-green') }}
            />
          )
          : null}
      </div>
      {/* plotly sometimes is unable to assign a proper height to the svg unless we set its default height as min-height */}
      <div class='mt3 mb4 chart flex-auto' style={{ minHeight: 450 }}>
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
    if (prevProps.explainerActive !== nextProps.explainerActive) {
      return false
    }
    const prevPageviews = prevProps.model.pageviews.map((p) => _.omit(p, 'date'))
    const nextPageviews = nextProps.model.pageviews.map((p) => _.omit(p, 'date'))
    return _.isEqual(prevPageviews, nextPageviews)
  }
)
