/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')
const sf = require('sheetify')
const DatePicker = require('react-datepicker').default
const format = require('date-fns/format')
const isFuture = require('date-fns/is_future')
const differenceInDays = require('date-fns/difference_in_days')

sf('./../../../../styles/react-datepicker/datepicker.scss')

module.exports = (props) => {
  const { onClose, from, to } = props
  const [startDate, setStartDate] = useState(from ? new Date(from) : new Date())
  const [endDate, setEndDate] = useState(to ? new Date(to) : null)

  let url = window.location.pathname
  if (startDate && endDate) {
    url = `${url}?from=${format(startDate, 'YYYY-MM-DD')}&to=${format(endDate, 'YYYY-MM-DD')}`
  }

  const now = new Date()

  return (
    <div class='flex flex-column'>
      <div class='flex justify-center mb3'>
        <div class='mr3'>
          <DatePicker
            locale={process.env.LOCALE || 'en'}
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            startDate={startDate}
            endDate={endDate}
            selectsStart
            inline
            filterDate={(date) => !isFuture(date) && differenceInDays(now, date) <= 6 * 31}
          />
        </div>
        <div class='ml3'>
          <DatePicker
            locale={process.env.LOCALE || 'en'}
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            startDate={startDate}
            endDate={endDate}
            selectsEnd
            minDate={startDate}
            inline
            filterDate={(date) => !isFuture(date) && differenceInDays(now, date) <= 6 * 31}
          />
        </div>
      </div>
      <div class='flex justify-center'>
        <a
          onclick={onClose}
          href={url}
          class='w-100 w-auto-ns f5 bn ph3 pv2 mb3 mr2 dib br1 white bg-mid-gray'
        >
          {__('Select')}
        </a>
      </div>
    </div>
  )
}
