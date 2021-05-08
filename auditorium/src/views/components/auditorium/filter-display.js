/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const filterDisplayNames = {
  href: __('URL'),
  referrer: __('Referrer'),
  campaign: __('campaign'),
  source: __('Source'),
  landing: __('Landing Page'),
  exit: __('Exit Page')
}

const FilterDisplay = (props) => {
  const { filter: current } = props

  const tokens = current.split(':')
  const filterKey = tokens.shift()
  const filterValue = tokens.join(':')

  let url = window.location.pathname
  const params = new window.URLSearchParams(window.location.search)
  params.delete('filter')
  if (params.toString()) {
    url += '?' + params
  }
  return (
    <div class='pa4 bg-white w-100'>
      <h4 class='f4 normal ma0'>
        {__('Filter')}
      </h4>
      <div class='flex-auto flex flex-row w-100 items-center'>
        <div class='w-60'>
          {filterDisplayNames[filterKey]}: <strong>{filterValue}</strong>
        </div>
        <div class='w-40'>
          <div class='link dim'>
            <a
              href={url}
              class='w-100 w-auto-ns f5 tc no-underline bn dib br1 ph3 pv2 mr0 mr2-ns mb3 white bg-mid-gray'
            >
              {__('Remove filter')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

module.exports = FilterDisplay
