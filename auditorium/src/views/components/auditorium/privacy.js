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
      <div>
        <Paragraph class='ma0 mb3'>
          {__('Stay opted in, only delete usage data')}
        </Paragraph>
        <div class='link dim'>
          <button
            class='pointer w-100 w-auto-ns f5 bn dib br1 ph3 pv2 mr1 white bg-mid-gray'
            data-role='purge'
            onclick={handlePurge}
          >
            {__('Delete')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div class='pa3 bg-black-05 flex-auto'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Privacy')}
      </h4>
      <div class='flex flex-column flex-wrap-m flex-row-ns'>

        <div class='w-100 w-50-m w-25-l pr4-ns pb3 pb4-l'>
          <Paragraph class='ma0 mb3'>
            {userHasOptedIn
              ? __('Opt out and delete usage data')
              : __('Opt in and grant access to your usage data')}
          </Paragraph>
          <div class='link dim'>
            <button
              class='pointer w-100 w-auto-ns f5 bn ph3 pv2 dib br1 white bg-mid-gray'
              data-role='consent'
              onclick={handleConsent}
            >
              {userHasOptedIn ? __('Opt out') : __('Opt in')}
            </button>
          </div>
        </div>
        <div class='w-100 w-50-m w-25-l bl-ns b--moon-gray ph4-ns pb3 pb4-l'>
          {deleteButton}
        </div>

        <div class='w-100 w-auto-m w-50-l bl-l b--moon-gray pl4-l mt3 mt0-l'>
          <Paragraph class='ma0 mb3'>
            {__('To review your data collected over time, set a bookmark for this page.')}
          </Paragraph>
        </div>


      </div>
    </div>
  )
}

module.exports = Privacy
