/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

// This module is used in local development only. It should register all
// known locales so that the Datepicker and the localized country display
// can be displayed correctly during development without having to include all
// locale files into the bundled output. There, only a single locale per
// localized bundle will be added.

const { registerLocale } = require('react-datepicker')
registerLocale('de', require('date-fns/locale/de'))
registerLocale('fr', require('date-fns/locale/fr'))

const countries = require('i18n-iso-countries')
countries.registerLocale(require('i18n-iso-countries/langs/en.json'))
countries.registerLocale(require('i18n-iso-countries/langs/de.json'))
countries.registerLocale(require('i18n-iso-countries/langs/fr.json'))
