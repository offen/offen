/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const Format = require('./format')
const RelativeTime = require('./relative-time')
const ExplainerIcon = require('./explainer-icon')
const Paragraph = require('./../_shared/paragraph')

const RetentionSquare = (props) => {
  const { children } = props
  if (!Number.isFinite(children)) {
    return null
  }
  return (
    <div class='h3 w-100 relative'>
      <div
        style={{ opacity: children !== 0 ? (children * 0.75 + 0.25) : 1 }}
        class={classnames(children === 0 ? 'bg-near-white' : 'bg-dark-green', 'absolute w-100 h-100')}
      />
      <p class='dib f6 br1-ns ma0 ma2-ns pa1 bg-white-80 absolute'>
        <Format formatAs='percentage'>
          {children}
        </Format>
      </p>
    </div>
  )
}

const RetentionTable = (props) => {
  const { model, showExplainer, explainerActive, onExplain } = props
  const matrix = model.retentionMatrix
  const rows = matrix.map(function (row, index) {
    const elements = row.slice()
    while (elements.length < matrix[0].length) {
      elements.push(null)
    }
    return (
      <tr key={index}>
        <th scope='row' class='tl normal'>
          <RelativeTime>
            {matrix.length - index - 1}
          </RelativeTime>
        </th>
        {elements.map(function (element, index) {
          return (
            <td key={index}>
              <RetentionSquare>
                {element}
              </RetentionSquare>
            </td>
          )
        })}
      </tr>
    )
  })

  return (
    <div class='pa3 bg-white flex-auto'>
      <div
        class={classnames('pa2', 'ma-1', explainerActive ? 'bg-light-yellow' : null)}
      >
        <h4 class='f4 normal ma0'>
          {__('Weekly retention')}
          {showExplainer ? <ExplainerIcon invert={explainerActive} marginLeft onclick={onExplain} /> : null}
        </h4>
        {explainerActive
          ? (
            <Paragraph class='mw7 ma0 pv2'>
              {__('This panel displays your recurring visits of pages of the <a href="#terms-offen-installation" class="%s">Offen installation</a> during the last 4 weeks. For each of the previous weeks, the percentage is calculated from the value of the current week.', 'b link dim dark-green')}
            </Paragraph>
            )
          : null}
      </div>
      <table class='w-100 collapse dt--fixed f6 f5-ns mt3 mb4'>
        <thead>
          <tr>
            <th />
            {matrix.map(function (row, index) {
              return (
                <th class='normal tl pb2' key={index} scope='col'>
                  <RelativeTime invert>
                    {index}
                  </RelativeTime>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  )
}

module.exports = RetentionTable
