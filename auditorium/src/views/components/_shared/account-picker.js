/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { Link, Container } = require('./../_shared/link-list')

const AccountPicker = (props) => {
  const { accounts, selectedId, headline, queryParams } = props

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
        const search = new window.URLSearchParams(queryParams)
        return (
          <Link
            href={`/auditorium/${account.accountId}/${search.toString() ? `?${search}` : ''}`}
            isActive={account.accountId === selectedId}
            key={idx}
          >
            {account.accountName}
          </Link>
        )
      })
    body = (
      <div class='mw6 center ph3 mt3'>
        <Container>
          {availableAccounts}
        </Container>
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
