/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Paragraph = require('./../_shared/paragraph')

module.exports = (props) => {
  return (
    <div class='ph3 ph4-ns pv4 bg-black-05' data-testid='auditorium/faq'>
      <h4 class='f4 normal mt0 mb4'>
        {__('FAQ')}
      </h4>
      <div class='flex flex-column flex-row-ns w-100'>
        <div class='w-100 w-50-ns mr2-ns mb4 mb0-ns'>
          <Paragraph class='i mt0 mb2'>
            {__('What data is collected?')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('Only page views, sessions, referrer and the visited URL are collected. From this, other metrics such as for example the bounce rate are calculated.')}
          </Paragraph>
          <Paragraph class='i mt0 mb2'>
            {__("What kind of data isn't collected?")}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('Device information and engagement are not collected. There are also no fingerprinting technologies in use.')}
          </Paragraph>
          <Paragraph class='i mt0 mb2'>
            {__('How is my data handled?')}
          </Paragraph>
          <Paragraph class='mt0 mb1'>
            {__('Your usage data is encrypted end-to-end. It will be automatically deleted after 6 months. You can delete your usage data yourself at any time in the privacy panel.')}
          </Paragraph>
        </div>
        <div class='w-100 w-50-ns ml4-ns'>
          <Paragraph class='i mt0 mb2'>
            {__('Why do I need to opt in or opt out?')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('Our banner serves two purposes: We ask you to access your usage data and would like to obtain your consent for its use.')}
          </Paragraph>
          <Paragraph class='i mt0 mb2'>
            {__('Do you use cookies?')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('Yes, in particular cookies are used to store your decision about granting access to your usage data. If you opt in, we also use <a href="#terms-cookies" class="%s">cookies</a> to store a user and a session <a href="#terms-id" class="%s">ID</a> for you.', 'b link dim dark-green', 'b link dim dark-green')}
          </Paragraph>
          <Paragraph class='i mt0 mb2'>
            {__('How does it all work?')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('After opening a website where a <a href="#terms-offen-installation" class="%s">Offen installation</a> is active, you can explicitly opt in to the data collection and thereby help to improve the services you use. Only then you will be assigned a user and a session <a href="#terms-id" class="%s">ID</a> using a <a href="#terms-cookies" class="%s">cookie.</a> Offen handles these <a href="#terms-id" class="%s">IDs</a> in an unrecognizable form, i.e. no server will ever store this identifier.', 'b link dim dark-green', 'b link dim dark-green', 'b link dim dark-green', 'b link dim dark-green')}
          </Paragraph>
        </div>
      </div>
    </div>
  )
}
