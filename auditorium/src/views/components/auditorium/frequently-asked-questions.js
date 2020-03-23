/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

module.exports = (props) => {
  return (
    <div class='ph3 ph4-ns pv4 bg-black-05'>
      <h4 class='f4 normal mt0 mb4'>
        {__('FAQ')}
      </h4>
      <div class='flex flex-column flex-row-ns w-100'>
        <div class='w-100 w-50-ns mr2-ns'>
          <p class='b mt0 mb1'>
            {__('What data is collected?')}
          </p>
          <p class='mt0 mb4'>
            {__('Only page views, sessions, referrer and visited URL are collected. From this, other metrics such as the bounce rate are calculated.')}
          </p>
          <p class='b mt0 mb1'>
            {__('What data isn\'t collected?')}
          </p>
          <p class='mt0 mb4'>
            {__('Location data, device information and engagement are not collected. There are also no fingerprinting technologies in use.')}
          </p>
          <p class='b mt0 mb1'>
            {__('How is my data handled?')}
          </p>
          <p class='mt0 mb4'>
            {__('Your usage data is encrypted end-to-end. It will be automatically deleted after 6 months. You can delete your usage data yourself at any time in the privacy panel.')}
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
          <p class='mt0 mb4'
            dangerouslySetInnerHTML={{ __html: __('Yes, in particular cookies are used to store your decision about granting access to your usage data. If you opt in, we also use <a href="#Cookies" class="%s">cookies</a> to store a user and a session <a href="#ID" class="%s">ID</a> for you.', 'link dim dark-green', 'link dim dark-green') }}
          />
          <p class='b mt0 mb1'>
            {__('How does it all work?')}
          </p>
          <p class='mt0 mb4'
            dangerouslySetInnerHTML={{ __html: __('After opening a website where a <a href="#Offen_installation" class="%s">Offen installation</a> is active, you can explicitly opt in to the data collection and thereby help to improve the services you use. Only then you will be assigned a user and a session <a href="#ID" class="%s">ID</a> using a <a href="#Cookies" class="%s">cookie.</a> Offen handles these <a href="#ID" class="%s">IDs</a> in an unrecognizable form.', 'link dim dark-green', 'link dim dark-green', 'link dim dark-green', 'link dim dark-green') }}
          />
        </div>
      </div>
    </div>
  )
}
