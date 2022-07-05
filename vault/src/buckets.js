/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

module.exports = _.memoize(mapToBuckets)

var buckets = [
  {
    re: /^(www\.)?google\.[a-z]/,
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
    re: /^android-app:\/\/com\.(S|s)lack\/?$/,
    name: 'Slack'
  },
  {
    re: /(www\.)?duckduckgo\.com($|\/)*/,
    name: 'DuckDuckGo'
  },
  {
    re: /(www\.)?ecosia\.org($|\/)*/,
    name: 'Ecosia'
  },
  {
    re: /(www\.)?qwant\.com($|\/)*/,
    name: 'Qwant'
  },
  {
    re: /(www\.)?baidu\.com($|\/)/,
    name: 'Baidu'
  },
  {
    re: /(www\.)?linkedin\.com($|\/)/,
    name: 'LinkedIn'
  },
  {
    re: /^android-app:\/\/com\.linkedin\./,
    name: 'LinkedIn'
  },
  {
    re: /t\.co($|\/)/,
    name: 'Twitter'
  },
  {
    re: /^news\.ycombinator\.com($|\/)/,
    name: 'Hacker News'
  },
  {
    re: [/^(old|www)\.reddit\.com($|\/)/, /^android-app:\/\/com.laurencedawson\.reddit_sync\./],
    name: 'Reddit'
  },
  {
    re: /\.wikipedia\.org($|\/)/,
    name: 'Wikipedia'
  },
  {
    re: /\.zoom\.us($|\/)/,
    name: 'Zoom'
  }
]

function mapToBuckets (referrerValue) {
  var bucket = _.find(buckets, function (b) {
    return [].concat(b.re).some(function (re) {
      return re.test(referrerValue)
    })
  })
  return (bucket && bucket.name) || referrerValue
}
