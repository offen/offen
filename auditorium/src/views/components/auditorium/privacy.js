/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Paragraph = require('./../_shared/paragraph')

const Privacy = (props) => {
  const { userHasOptedIn } = props

  function handleConsent () {
    const nextStatus = userHasOptedIn ? 'deny' : 'allow'
    props.onConsent(nextStatus)
  }

  function handlePurge () {
    props.onPurge()
  }

  let deleteButton = null
  if (userHasOptedIn) {
    deleteButton = (
      <div class='bl-ns b--moon-gray pl4-ns'>
        <Paragraph class='ma0 mb3'>
          {__('Stay opted in, only delete usage data')}
        </Paragraph>
        <button
          class='pointer w-100 w-auto-ns f5 link dim bn dib br1 ph3 pv2 mr1 mb4 white bg-mid-gray'
          data-role='purge'
          onclick={handlePurge}
        >
          {__('Delete')}
        </button>
      </div>
    )
  }

  return (
    <div class='pa3 bg-black-05 flex-auto'>
      <div class='flex flex-column flex-row-ns'>
        <div class='w-100 w-auto-m w-40-l mb0-ns pr0 pr4-ns mr0 mr4-ns'>
          <h4 class='f4 normal mt0 mb3'>
            {__('Privacy')}
          </h4>
          <Paragraph class='ma0 mb3'>
            {userHasOptedIn
              ? __('Opt out and delete usage data')
              : __('Opt in and grant access to your usage data')}
          </Paragraph>
          <button
            class='pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 dib br1 mb4 white bg-mid-gray'
            data-role='consent'
            onclick={handleConsent}
          >
            {userHasOptedIn ? __('Opt out') : __('Opt in')}
          </button>
        </div>
        <div class='w-100 w-auto-m w-60-l pt4-ns mt2-ns'>
          {deleteButton}
        </div>
      </div>
    </div>
  )
}

module.exports = Privacy
