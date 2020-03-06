/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var extractStrings = require('./extract.js')

module.exports = taskFrom

function taskFrom (locales) {
  return function () {
    var eligible = locales
      .filter(function (locale) {
        return locale !== 'en'
      })

    if (eligible.length === 0) {
      console.log('No non-default locales were configured. Nothing to do.')
      console.log('If this is unintended, check the locales passed to this task.')
      return Promise.resolve()
    }

    return Promise.all(eligible.map(function (locale) {
      return extractStrings('./locales/' + locale + '.po', '**/*.js')
    }))
  }
}
