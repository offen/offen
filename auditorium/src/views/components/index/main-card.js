/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')

const Headline = require('./../_shared/headline')
const Paragraph = require('./../_shared/paragraph')

module.exports = (props) => {
  let mainQuestion = null
  let dataHandled = null
  if (props.consentStatus === 'allow') {
    mainQuestion = (
      <Fragment>
        <Headline level={3} class='f5 i normal mt0 mb2'>
          {__('How can I review and delete my usage data or opt out?')}
        </Headline>
        <Paragraph class='mt0 mb4'>
          {__('<a href="%s" class="%s">Go to the Auditorium.</a>', '/auditorium/', 'b link dim dark-green')}
        </Paragraph>
      </Fragment>
    )
    dataHandled = (
      <Fragment>
        <Paragraph class='mt0 mb1'>
          {__('Your usage data is encrypted end-to-end. It will be automatically deleted within 6 months. <a href="/auditorium/" class="%s">You can delete your usage data yourself at any time in the Auditorium.</a>', 'b link dim dark-green')}
        </Paragraph>
      </Fragment>
    )
  } else {
    mainQuestion = (
      <Fragment>
        <Headline level={3} class='f5 i normal mt0 mb2'>
          {__('How can I review and delete my usage data?')}
        </Headline>
        <Paragraph class='mt0 mb4'>
          {__('For data to be collected you need to opt in first. <a href="%s" class="%s">You can do this in the consent banner.</a>', '#consent-banner', 'b link dim dark-green')}
        </Paragraph>
      </Fragment>
    )
    dataHandled = (
      <Fragment>
        <Paragraph class='mt0 mb1'>
          {__('Your usage data is encrypted end-to-end. It will be automatically deleted within 6 months. You can delete your usage data yourself at any time.')}
        </Paragraph>
      </Fragment>
    )
  }
  return (
    <div class='ph3 ph4-ns pv4 bg-black-05' data-testid='index/faq'>
      <div class='flex flex-column flex-row-ns w-100'>
        <div class='w-100 w-50-ns mr2-ns mb4 mb0-ns'>
          {mainQuestion}
          <Headline level={3} class='f5 i normal mt0 mb2'>
            {__('What data is collected?')}
          </Headline>
          <Paragraph class='mt0 mb4'>
            {__('Only page views, sessions, referrer and visited URLs are collected. From this, other metrics such as the bounce rate are calculated.')}
          </Paragraph>
          <Headline level={3} class='f5 i normal mt0 mb2'>
            {__("What data isn't collected?")}
          </Headline>
          <Paragraph class='mt0 mb4'>
            {__('Device information and engagement are not collected. There are also no fingerprinting technologies in use.')}
          </Paragraph>
          <Headline level={3} class='f5 i normal mt0 mb2'>
            {__('How is my data handled?')}
          </Headline>
          {dataHandled}
        </div>
        <div class='w-100 w-50-ns ml4-ns'>
          <Headline level={3} class='f5 i normal mt0 mb2'>
            {__('Why do I need to opt in or opt out?')}
          </Headline>
          <Paragraph class='mt0 mb4'>
            {__('Our banner serves two purposes: We ask you to access your usage data and would like to obtain your consent for its use.')}
          </Paragraph>
          <Headline level={3} class='f5 i normal mt0 mb2'>
            {__('Do you use cookies?')}
          </Headline>
          <Paragraph class='mt0 mb4'>
            {__('Yes, in particular cookies are used to store your decision about granting access to your usage data. If you opt in, we also use cookies to store a user and a session ID for you.')}
          </Paragraph>
          <Headline level={3} class='f5 i normal mt0 mb2'>
            {__('How does it all work?')}
          </Headline>
          <Paragraph class='mt0 mb1'>
            {__('After opening a website where an Offen installation is active, you can explicitly opt in to the data collection and thereby help to improve the services you use. Only then you will be assigned a user and a session ID using a cookie. Offen handles these IDs in an unrecognizable form. <a href="https://en.wikipedia.org/wiki/HTTP_cookie" class="%s" target="_blank" rel="noreferer noopener">Learn more about cookies here.</a>', 'b link dim dark-green')}
          </Paragraph>
        </div>
      </div>
    </div>
  )
}
