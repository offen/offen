/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')
const sf = require('sheetify')
const DatePicker = require('react-datepicker').default
const format = require('date-fns/format')
const subDays = require('date-fns/subDays')

const LocalizedDate = require('./../_shared/localized-date')

sf('./../../../../styles/react-datepicker/datepicker.scss')

const localeMap = {
  en: require('date-fns/locale/en-GB')
}

module.exports = (props) => {
  const { onClose, from, to } = props
  const [startDate, setStartDate] = useState(from ? new Date(from) : new Date())
  const [endDate, setEndDate] = useState(from ? new Date(to) : new Date())
  const dateFormatProps = { year: 'numeric', month: 'long', day: 'numeric' }

  let url = window.location.pathname
  if (startDate && endDate) {
    url = `${url}?from=${format(startDate, 'yyyy-MM-dd')}&to=${format(endDate, 'yyyy-MM-dd')}`
  }

  const now = new Date()

  return (
    <div class='datepicker-display flex flex-column'>
      <div class='flex justify-center mb3'>
        <div class='br b--light-gray pr4'>
          <DatePicker
            locale={localeMap[process.env.LOCALE] || process.env.LOCALE || 'en-GB'}
            inline
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            startDate={startDate}
            endDate={endDate}
            selectsStart
            minDate={subDays(now, 6 * 31)}
            maxDate={endDate}
          />
        </div>
        <div class='pl4'>
          <DatePicker
            locale={localeMap[process.env.LOCALE] || process.env.LOCALE || 'en-GB'}
            inline
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            startDate={startDate}
            endDate={endDate}
            selectsEnd
            minDate={startDate}
            maxDate={now}
          />
        </div>
      </div>

      <div class='flex justify-center mb3'>
        <div class='w-60-m w-40-l br2 bg-near-white pv3'>
          <div class='flex justify-center mb3'>
            <div class='w-40 tr mr2'>
              <LocalizedDate {...dateFormatProps}>
                {startDate}
              </LocalizedDate>
            </div>
            <div class='bt b--dark-gray ph3 mt2' />
            <div class='w-40 tl ml2'>
              <LocalizedDate {...dateFormatProps}>
                {endDate}
              </LocalizedDate>
            </div>
          </div>
          <div class='flex justify-center'>
            <a
              onclick={onClose}
              href={url}
              class='f5 tc no-underline dim bn ph4 pv2 dib br1 white bg-dark-green'
            >
              {__('Select')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
