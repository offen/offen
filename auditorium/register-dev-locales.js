/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

// This module is used in local development only. It should register all
// known locales so that the Datepicker can be displayed correctly during
// development without having to include all locale files into the bundled
// output. There, only a single locale per localized bundle will be added.

const { registerLocale } = require('react-datepicker')
const locale = require('date-fns/locale/de')
registerLocale('de', locale)
