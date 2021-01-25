/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const localeMap = {
  en: 'en-GB',
  de: 'de-DE'
}

const LocalizedDate = (props) => {
  const { year, month, day } = props
  return localize(props.children, { year, month, day })
}

LocalizedDate.localize = localize

module.exports = LocalizedDate

function localize (date, options) {
  return date.toLocaleDateString(
    localeMap[process.env.LOCALE] || process.env.LOCALE,
    options
  )
}
