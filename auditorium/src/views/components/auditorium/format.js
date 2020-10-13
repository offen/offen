/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Format = (props) => {
  const { formatAs, children, factor, digits } = props
  const source = Number.isFinite(children) ? children : 0
  let value = null
  let tooltip = null
  switch (formatAs) {
    case 'boolean':
      value = source === 0 ? __('No') : __('Yes')
      break
    case 'duration':
      value = formatDuration(source)
      break
    case 'count':
      value = formatCount(source)
      tooltip = value !== Math.floor(source) ? formatNumber(source, 1, 0) : null
      break
    case 'percentage':
      value = formatNumber(source, 100, 1) + ' %'
      break
    default:
      value = formatNumber(source, factor, digits)
  }
  return tooltip
    ? (
      <span title={tooltip}>
        {value}
      </span>
    )
    : value
}

module.exports = Format

module.exports.formatDuration = formatDuration
function formatDuration (valueInMs) {
  if (valueInMs >= 1000) {
    return formatNumber(valueInMs / 1000, 1, 2) + __('s')
  }
  return Math.round(valueInMs) + __('ms')
}

module.exports.formatCount = formatCount
function formatCount (count) {
  if (count > 1000000) {
    return formatNumber(count / 1000000) + __('M')
  }
  if (count > 1000) {
    return formatNumber(count / 1000) + __('k')
  }
  return Math.floor(count)
}

module.exports.formatNumber = formatNumber
function formatNumber (value, factor = 1, digits = 1) {
  return (value * factor).toLocaleString(process.env.LOCALE, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  })
}
