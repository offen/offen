/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')

module.exports = (props) => {
  let mainQuestion = null
  if (props.consentStatus === 'allow') {
    mainQuestion = (
      <Fragment>
        <p class='b mt0 mb1'>
          {__('How can I review and delete my usage data or opt out?')}
        </p>
        <p
          class='mt0 mb4'
          dangerouslySetInnerHTML={{ __html: __('Go to the <a href="%s" class="%s">Auditorium.</a>', '/auditorium/', 'link dim dark-green') }}
        />
      </Fragment>
    )
  } else {
    mainQuestion = (
      <Fragment>
        <p class='b mt0 mb1'>
          {__('How can I review and delete my usage data?')}
        </p>
        <p
          class='mt0 mb4'
          dangerouslySetInnerHTML={{ __html: __('For data to be collected you need to opt in first. You can do this in the <a href="%s" class="%s">consent banner.</a>', '#consentBanner', 'link dim dark-green') }}
        />
      </Fragment>
    )
  }
  return (
    <div class='ph3 ph4-ns pv4 bg-black-05'>
      <div class='flex flex-column flex-row-ns w-100'>
        <div class='w-100 w-50-ns mr2-ns'>
          {mainQuestion}
          <p class='b mt0 mb1'>
            {__('What data is collected?')}
          </p>
          <p class='mt0 mb4'>
            {__('Only page views, sessions, referrer and visited URL are collected. From this, other metrics such as the bounce rate are calculated.')}
          </p>
          <p class='b mt0 mb1'>
            {__("What data isn't collected?")}
          </p>
          <p class='mt0 mb4'>
            {__('Location data, device information and engagement are not collected. There are also no fingerprinting technologies in use.')}
          </p>
          <p class='b mt0 mb1'>
            {__('How is my data handled?')}
          </p>
          <p class='mt0 mb4'>
            {__('Your data is encrypted end-to-end. It will be deleted after 6 months at the latest. Offen does not share your data with third-parties.')}
          </p>
        </div>
        <div class='w-100 w-50-ns ml4-ns'>
          <p class='b mt0 mb1'>
            {__('Why do I need to opt in or opt out?')}
          </p>
          <p class='mt0 mb4'>
            {__('Our banner serves two purposes: We ask you to access your usage data and would like to obtain your consent for its use.')}
          </p>
          <p class='b mt0 mb1'>
            {__('Do you use cookies?')}
          </p>
          <p class='mt0 mb4'>
            {__('Yes, in particular cookies are used to store your decision about granting access to your usage data. If you opt in, we also use cookies to store a user and a session ID for you.')}
          </p>
          <p class='b mt0 mb1'>
            {__('How does it all work?')}
          </p>
          <p class='mt0 mb1'>
            {__('After opening a website that has offen installed you can explicitly opt in to the data collection and thereby help to improve the services you use.')}
          </p>
          <p
            class='mt0 mb1'
            dangerouslySetInnerHTML={{ __html: __('Only then you will be assigned a user and a session ID using a cookie. Learn more about cookies <a href="https://en.wikipedia.org/wiki/HTTP_cookie" class="%s" target="_blank">here.</a>', 'link dim dark-green') }}
          />
          <p class='mt0 mb4'>
            {__('Offen handles these IDs in an unrecognizable form. Operators can identify you only within one website.')}
          </p>
        </div>
      </div>
    </div>
  )
}
