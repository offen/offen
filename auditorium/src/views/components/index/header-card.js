/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const ForwardingAnchor = require('./../_shared/forwarding-anchor')

module.exports = (props) => {
  let content = null
  if (!props.allowsCookies) {
    content = (
      <div class='w-100 w-90-ns mr3-ns'>
        <h3 class='f4 normal ma0 mb3'>
          {__('Offen Fair Web Analytics requires cookies to function properly.')}
        </h3>
        <p class='ma0 mb2'>
          {__('Offen Fair Web Analytics is a fair and open source analytics software. It is installed on the website that linked you here.')}
        </p>
        <p class='ma0'>
          {__('For Offen Fair Web Analytics to work, your browser has to accept cookies. Please change your browsers settings and reload this page. Subsequently, you will be asked for consent to collect your usage data.')}
        </p>
      </div>
    )
  } else if (props.consentStatus === 'allow') {
    content = (
      <Fragment>
        <div class='w-100 w-60-ns mr3-ns'>
          <h2 class='f4 normal tc tl-ns mt0 mb0'>
            {__('Manage your usage data this website has collected.')}
          </h2>
        </div>
        <div class='w-100 w-40-ns link dim tc mt2 mt0-ns'>
          <ForwardingAnchor
            href='/auditorium/'
            class='f5 tc no-underline bn ph3 pv2 dib br1 white bg-dark-green'
            data-testid='index/open-auditorium'
          >
            {__('Open Auditorium')}
          </ForwardingAnchor>
        </div>
      </Fragment>
    )
  } else {
    const noStatusYet = props.consentStatus !== 'deny'
    content = (
      <Fragment>
        <div class='w-100 w-60-ns mr3-ns' id='consent-banner' data-testid='index/consent-banner'>
          <h2 class='f4 normal tl-ns ma0 mb3'>
            {__('We only access usage data with your consent.')}
          </h2>
          <p class='ma0 mb2'>
            {__('Offen Fair Web Analytics is a fair and open source analytics software. Help the website that linked you here by allowing access to your usage data.')}
          </p>
          <p class='ma0 mb2 mb0-ns'>
            {__('Your data always remains yours. You can review and delete it at any time. Opt out again whenever you want.')}
          </p>
        </div>
        <div class='flex justify-center w-100 w-40-ns tc mt2 mt0-ns'>
          <div class='link dim'>
            <button
              class='pointer f5 tc bn ph3 pv2 dib br1 mr3 white bg-mid-gray' onclick={() => props.expressConsent('allow')}
              data-testid='index/consent-opt-in'
            >
              {__('I allow')}
            </button>
          </div>
          <div class='link dim'>
            <button
              class={`f5 tc bn ph3 pv2 dib br1 white ${noStatusYet ? 'bg-mid-gray pointer' : 'bg-light-gray'}`} onclick={() => props.expressConsent('deny')}
              disabled={!noStatusYet}
              data-testid='index/consent-opt-out'
            >
              {__('I don\'t allow')}
            </button>
          </div>
        </div>
      </Fragment>
    )
  }
  return (
    <div class='ph3 ph4-ns pv4 bg-white flex flex-column flex-row-ns items-center'>
      {content}
    </div>
  )
}
