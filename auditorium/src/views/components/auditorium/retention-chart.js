/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const Format = require('./format')
const RelativeTime = require('./relative-time')

const RetentionSquare = (props) => {
  const { children } = props
  if (!Number.isFinite(children)) {
    return null
  }
  return (
    <div title={`${Format.formatNumber(children, 100)}%`}>
      <div
        style={{ opacity: children !== 0 ? (children * 0.75 + 0.25) : 1 }}
        class={classnames({ 'bg-dark-green': children !== 0 }, { 'bg-near-white': children === 0 }, 'h3', 'w-100')}
      />
    </div>
  )
}

const RetentionTable = (props) => {
  const { model } = props
  const matrix = model.retentionMatrix
  const rows = matrix.map(function (row, index) {
    var elements = row.slice()
    while (elements.length < matrix[0].length) {
      elements.push(null)
    }
    return (
      <tr key={index}>
        <td>
          <RelativeTime>{index}</RelativeTime>
        </td>
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
      <h4 class='f4 normal mt0 mb3'>
        {__('Weekly retention')}
      </h4>
      <table class='w-100 collapse mb4 dt--fixed'>
        <thead>
          <tr>
            <td />
            {matrix.map(function (row, index) {
              return (
                <td key={index}>
                  <RelativeTime>
                    {index}
                  </RelativeTime>
                </td>
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
