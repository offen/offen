/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const ForwardingAnchor = require('./forwarding-anchor')

const AccountPicker = (props) => {
  const { accounts, selectedId, headline } = props

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
        let buttonClass = 'link dim dib br1 ph3 pv2 mb2 mr2 white bg-mid-gray'
        if (isCurrent) {
          buttonClass = 'link dim dib br1 ph3 pv2 mb2 mr2 white bg-black-30'
        }

        return (
          <li key={idx}>
            <ForwardingAnchor
              href={`/auditorium/${account.accountId}/`}
              class={buttonClass}
              aria-current={isCurrent ? 'page' : 'false'}
            >
              {account.accountName}
            </ForwardingAnchor>
          </li>
        )
      })
    body = (
      <div class='mw6 center ph3 mt3'>
        <ul class='flex flex-wrap list pl0 ma0 b--moon-gray'>
          {availableAccounts}
        </ul>
      </div>
    )
  }

  return (
    <div class='flex-auto bg-black-05 pb4'>
      <h2
        class='f4 normal pa3 ma0'
        dangerouslySetInnerHTML={{
          __html: headline
        }}
      />
      {body}
    </div>
  )
}

module.exports = AccountPicker
