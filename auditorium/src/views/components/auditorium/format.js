/** @jsx h */
const { h, Fragment } = require('preact')

const Format = (props) => {
  const { formatAs, children, factor, digits } = props
  const source = Number.isFinite(children) ? children : 0
  let value = null
  switch (formatAs) {
    case 'duration':
      value = formatDuration(source)
      break
    case 'count':
      value = formatCount(source)
      break
    case 'percentage':
      value = formatNumber(source, 100, 1) + ' %'
      break
    default:
      value = formatNumber(source, factor, digits)
  }
  return (
    <Fragment>
      {value}
    </Fragment>
  )
}

module.exports = Format

module.exports.formatDuration = formatDuration
function formatDuration (valueInMs) {
  if (valueInMs >= 1000) {
    return formatNumber(valueInMs / 1000, 1, 2) + __('s')
  }
  return Math.round(valueInMs) + __(' ms')
}

module.exports.formatCount = formatCount
function formatCount (count) {
  if (count > 1000000) {
    return formatNumber(count / 1000000) + __(' M')
  }
  if (count > 1000) {
    return formatNumber(count / 1000) + __(' k')
  }
  return count
}

module.exports.formatNumber = formatNumber
function formatNumber (value, factor, digits) {
  return (value * (factor || 1)).toLocaleString(process.env.LOCALE, {
    maximumFractionDigits: digits || 1,
    minimumFractionDigits: digits || 1
  })
}
