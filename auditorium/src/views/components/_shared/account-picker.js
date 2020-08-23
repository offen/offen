/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const AccountPicker = (props) => {
  const { accounts, selectedId, headline, range, resolution } = props

  let body = null
  if (!Array.isArray(accounts) || !accounts.length) {
    body = (
      <p class='ma0 mt2'>
        {__('You currently do not have any active accounts. You can create one below.')}
      </p>
    )
  } else {
    const availableAccounts = accounts
      .slice()
      .sort(function (a, b) {
        return a.accountName.localeCompare(b.accountName)
      })
      .map(function (account, idx) {
        const isCurrent = account.accountId === selectedId
        let buttonClass = 'b link dim dib pv2 mt1 mb2 mr3 mid-gray'
        if (isCurrent) {
          buttonClass = 'b link dim dib bt bw2 b--mid-gray ph2 pv2 mb2 mr3 mid-gray'
        }

        let query = null
        if (range || resolution) {
          query = new window.URLSearchParams({ range, resolution })
        }

        return (
          <li class='bt b--moon-gray' key={idx}>
            <a
              href={`/auditorium/${account.accountId}/${query ? `?${query}` : ''}`}
              class={buttonClass}
              aria-current={isCurrent ? 'page' : 'false'}
            >
              {account.accountName}
            </a>
          </li>
        )
      })
    body = (
      <ul class='flex flex-wrap list pl0 mt0 mb3 grow-list b--moon-gray'>
        {availableAccounts}
      </ul>
    )
  }

  return (
    <div class='flex-auto bg-black-05 pa3'>
      <h2
        class='f4 normal mt0 mb3'
        dangerouslySetInnerHTML={{
          __html: headline
        }}
      />
      {body}
    </div>
  )
}

module.exports = AccountPicker
