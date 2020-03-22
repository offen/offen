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
        {__('Basic Terms')}
      </h4>
      <div class='flex flex-column flex-row-ns w-100'>
        <div class='w-100 w-50-ns mr2-ns'>
          <p class='b mt0 mb1' id='Auditorium'>
            {__('Auditorium')}
          </p>
          <p class='mt0 mb4'>
            {__('You are viewing the Audiotorium right now. Only available after opt in, it is the interface where you can review and delete your usage data or opt out entirely.')}
          </p>
          <p class='b mt0 mb1' id='Offen_installation'>
            {__('Offen installation')}
          </p>
          <p class='mt0 mb4'
            dangerouslySetInnerHTML={{ __html: __('One Offen installation can include several websites. All metrics of all websites in this installation are displayed in the <a href="#Auditorium" class="%s">Auditorium.</a> Metrics generated on websites of other installations can only be viewed in the associated <a href="#Auditorium" class="%s">Auditorium.</a>', 'link dim dark-green', 'link dim dark-green') }}
          />
          <p class='b mt0 mb1' id='Cookies'>
            {__('Cookies')}
          </p>
          <p class='mt0 mb4'
            dangerouslySetInnerHTML={{ __html: __('When you visit a website where a <a href="#Offen_installation" class="%s">Offen installation</a> is active, small amounts of data are stored on your computer. These data elements are known as cookies. <a href="https://en.wikipedia.org/wiki/HTTP_cookie" class="%s" target="_blank">Learn more.</a>', 'link dim dark-green', 'link dim dark-green') }}
          />
          <p class='b mt0 mb1' id='Operator'>
            {__('Operator')}
          </p>
          <p class='mt0 mb4'
            dangerouslySetInnerHTML={{ __html: __('Operators are owners of <a href="#Offen_installation" class="%s">Offen installations.</a> Only after you opted in, your usage data of a website is collected. Operators than can view it for maximum 6 months.', 'link dim dark-green') }}
          />
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
