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
    re: /^(l|lm|m)\.facebook\.com/,
    name: 'Facebook'
  }
]

function mapToBuckets (referrerValue) {
  var bucket = _.find(buckets, function (b) {
    return b.re.test(referrerValue)
  })
  return (bucket && bucket.name) || referrerValue
}
