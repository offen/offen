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
      <div class='w-100 w-50-m w-25-l bl-ns b--moon-gray pl4-ns pb3 pb4-l'>
        <div class='flex flex-column-ns'>
          <Paragraph class='ma0 mb1'>
            {__('Stay opted in,&nbsp;')}
          </Paragraph>
          <Paragraph class='ma0 mb3'>
            {__('only delete usage data.')}
          </Paragraph>
        </div>
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
    <div class='bg-black-05 flex-auto pa3'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Privacy')}
      </h4>
      <div class='flex flex-column flex-wrap-m flex-row-ns'>
        <div class='w-100 w-50-m w-25-l pr3-m pr4-l pb4'>
          <div class='flex flex-column-ns'>
            <Paragraph class='ma0 mb1'>
              {userHasOptedIn
                ? __('Opt out&nbsp;')
                : __('Opt in and grant&nbsp;')}
            </Paragraph>
            <Paragraph class='ma0 mb3'>
              {userHasOptedIn
                ? __('and delete usage data.')
                : __('access to your usage data.')}
            </Paragraph>
          </div>
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
        {deleteButton}
        <div class='w-100 w-50-l bl-l b--moon-gray pl4-l mt3 mt0-l'>
          <div class='cf mb3'>
            <div class='fl mr3'>
              <svg width='30' height='30' fill='none' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'>
                <circle cx='15' cy='15' r='14.25' stroke='#555' stroke-width='1.5' />
                <path d='m15.905 16.186h-1.666l-0.1833-8.1862h2.0406l-0.1913 8.1862zm-1.9051 3.5029c0-0.3029 0.0983-0.5526 0.2949-0.7492 0.1966-0.202 0.465-0.3029 0.8051-0.3029s0.6085 0.1009 0.8051 0.3029c0.1966 0.1966 0.2949 0.4463 0.2949 0.7492 0 0.2923-0.0957 0.5367-0.287 0.7334-0.1913 0.1966-0.4623 0.2949-0.813 0.2949s-0.6217-0.0983-0.813-0.2949c-0.1913-0.1967-0.287-0.4411-0.287-0.7334z' fill='#333' />
              </svg>
            </div>
            <div class='h2 flex flex-wrap items-center'>
              <Paragraph class='ma0 mb1'>
                {__('To review your data collected over time,&nbsp;')}
              </Paragraph>
              <Paragraph class='ma0 mb1'>
                {__('set a bookmark for this page.')}
              </Paragraph>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

module.exports = Privacy
