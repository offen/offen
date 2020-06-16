/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')

module.exports = (props) => {
  let content = null
  if (!props.allowsCookies) {
    content = (
      <div class='w-100 w-90-ns mr3-ns'>
        <h3 class='f4 normal ma0 mb3'>
          {__('Offen requires cookies to function properly.')}
        </h3>
        <p class='ma0 mb2'>
          {__('Offen is a fair and open source analytics software. It is installed on the website that linked you here.')}
        </p>
        <p class='ma0'>
          {__('For Offen to work, your browser has to accept cookies. Please change your browsers settings and reload this page. Subsequently, you will be asked for consent to collect your usage data.')}
        </p>
      </div>
    )
  } else if (props.consentStatus === 'allow') {
    content = (
      <Fragment>
        <div class='w-100 w-60-ns mr3-ns'>
          <h3 class='f4 normal tc tl-ns mt0 mb0'>
            {__('Manage the usage data that has been collected from you.')}
          </h3>
        </div>
        <div class='w-100 w-40-ns tc mt2 mt0-ns'>
          <a href='/auditorium/' class='f5 tc link dim bn ph3 pv2 dib br1 white bg-dark-green'>
            {__('Open Auditorium')}
          </a>
        </div>
      </Fragment>
    )
  } else {
    const noStatusYet = props.consentStatus !== 'deny'
    content = (
      <Fragment>
        <div class='w-100 w-60-ns mr3-ns' id='consent-banner'>
          <h3 class='f4 normal tl-ns ma0 mb3'>
            {__('We only access your usage data if you allow.')}
          </h3>
          <p class='ma0 mb2'>
            {__('Offen is a fair and open source analytics software. Help the website that linked you here by opting in and thereby granting access to your usage data.')}
          </p>
          <p class='ma0 mb2 mb0-ns'>
            {__('Your data always remains yours. You can review and delete it at any time. Opt out again whenever you want.')}
          </p>
        </div>
        <div class='w-100 w-40-ns tc mt2 mt0-ns'>
          <button class='pointer f5 tc link dim bn ph3 pv2 dib br1 mr3 white bg-mid-gray' onclick={() => props.expressConsent('allow')}>
            {__('Yes please')}
          </button>
          <button disabled={!noStatusYet} class={`f5 tc link dim bn ph3 pv2 dib br1 white ${noStatusYet ? 'bg-mid-gray pointer' : 'bg-light-gray'}`} onclick={() => props.expressConsent('deny')}>
            {__('I do not allow')}
          </button>
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
