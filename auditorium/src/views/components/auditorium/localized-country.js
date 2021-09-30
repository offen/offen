/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const countries = require('i18n-iso-countries')

const LocalizedCountry = (props) => {
  const display = countries.getName(props.children, process.env.LOCALE, { select: 'official' }) || props.children
  return display
}

module.exports = LocalizedCountry
