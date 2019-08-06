var _ = require('underscore')

module.exports = mapToBuckets

var buckets = [
  {
    re: /^www\.google\./,
    name: 'Google'
  },
  {
    re: /^android-app:\/\/org\.telegram\./,
    name: 'Telegram'
  },
  {
    re: /^web\.telegram\.org$/,
    name: 'Telegram'
  },
  {
    re: /^(l|lm|m|www)\.facebook\.com/,
    name: 'Facebook'
  },
  {
    re: /^android-app:\/\/com\.Slack$/,
    name: 'Slack'
  },
  {
    re: /(www\.)?duckduckgo\.com($|\/)*/,
    name: 'DuckDuckGo'
  },
  {
    re: /(www\.)?baidu\.com($|\/)/,
    name: 'Baidu'
  }
]

function mapToBuckets (referrerValue) {
  var bucket = _.find(buckets, function (b) {
    return b.re.test(referrerValue)
  })
  return (bucket && bucket.name) || referrerValue
}
