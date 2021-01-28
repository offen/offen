/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { memo } = require('preact/compat')
const Plotly = require('plotly.js-basic-dist')
const createPlotlyComponent = require('react-plotly.js/factory').default
const isFirstDayOfMonth = require('date-fns/isFirstDayOfMonth')
const isWeekend = require('date-fns/isWeekend')
const getISOWeek = require('date-fns/getISOWeek')
const getHours = require('date-fns/getHours')
const _ = require('underscore')
const classnames = require('classnames')
const path = require('path')
const urify = require('urify')

const ExplainerIcon = require('./explainer-icon')
const Paragraph = require('./../_shared/paragraph')
const LocalizedDate = require('./../_shared/localized-date')

const Plot = createPlotlyComponent(Plotly)

const tickColorFade = '#767676'
const barColorVisitors = '#0b533d'
const barColorVisitorsFade = '#0b533d'
const barColorViews = '#19A974'
const barColorViewsFade = '#19A974'

const Chart = (props) => {
  const { model, isOperator, showExplainer, onExplain, explainerActive } = props
  const { pageviews, resolution } = model

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
        return LocalizedDate.localize(date, { month: 'short' })
      default: {
        let result = LocalizedDate.localize(date, { day: 'numeric' })
        if (index === 0 || isFirstDayOfMonth(date)) {
          result = LocalizedDate.localize(date, { month: 'short' }) + ' ' + result
        }
        if (isWeekend(date)) {
          return `<span style="font-style: italic; color: ${tickColorFade}; font-size: 130%">${result}</span>`
        }
        return result
      }
    }
  })

  const data = [
    {
      type: 'bar',
      x: x,
      y: yVisitors,
      hoverinfo: 'y',
      marker: {
        color: x.map(function (value) {
          const date = new Date(value)
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
        color: x.map(function (value) {
          const date = new Date(value)
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
      tickcolor: '#ffffff',
      ticklen: 10,
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
            <Paragraph class='mw7 ma0 pv2'>
              {__('This panel displays the number of pages (bright green) and websites (dark green) you have visited where the <a href="#terms-offen-installation" class="%s">Offen installation</a> is active. To measure this, a cookie is used to assign you a user and a session <a href="#terms-id" class="%s">ID.</a>', 'b link dim dark-green', 'b link dim dark-green')}
            </Paragraph>
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
            <div class='w-100 h-100 db bg-near-white br2'>
              <div class='tc pt5'>
                <img src={urify(path.join(__dirname, 'offen-empty-state.svg'))} alt={__('Empty state')} width='180' height='190' class='ma0' />
                <Paragraph class='i lh-copy ma0 mt3'>
                  {__('No data available <br>for the selected time range.')}
                </Paragraph>
              </div>
            </div>
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
