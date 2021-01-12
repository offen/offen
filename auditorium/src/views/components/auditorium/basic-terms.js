/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Paragraph = require('./../_shared/paragraph')

module.exports = (props) => {
  return (
    <div class='ph3 ph4-ns pv4 bg-black-05' data-testid='auditorium/basic-terms'>
      <h4 class='f4 normal mt0 mb4'>
        {__('Basic Terms')}
      </h4>
      <div class='flex flex-column flex-row-ns w-100'>
        <div class='w-100 w-50-ns mr2-ns'>
          <Paragraph class='i mt0 mb2' id='terms-auditorium'>
            {__('Auditorium')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('You are viewing the Auditorium right now. Only available after opt-in, it is the interface where you can review and delete your usage data or opt out entirely.')}
          </Paragraph>
          <Paragraph class='i mt0 mb2' id='terms-offen-installation'>
            {__('Offen installation')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('One Offen installation can include several websites. All metrics of all websites in this installation are displayed in the <a href="#terms-auditorium" class="%s">Auditorium.</a> Metrics generated on websites of other installations can only be viewed in the associated <a href="#terms-auditorium" class="%s">Auditorium.</a>', 'b link dim dark-green', 'b link dim dark-green')}
          </Paragraph>
          <Paragraph class='i mt0 mb2' id='terms-cookies'>
            {__('Cookies')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('When you visit a website where a <a href="#terms-offen-installation" class="%s">Offen installation</a> is active, small amounts of data are stored on your computer. These data elements are known as cookies. <a href="https://en.wikipedia.org/wiki/HTTP_cookie" class="%s" target="_blank" rel="noreferer noopener">Learn more.</a>', 'b link dim dark-green', 'b link dim dark-green')}
          </Paragraph>
          <Paragraph class='i mt0 mb2' id='terms-operator'>
            {__('Operator')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('Operators are the owners of <a href="#terms-offen-installation" class="%s">Offen installations.</a> Only after you opted in, your usage data of a website is collected. Operators than can view it for maximum 6 months.', 'b link dim dark-green')}
          </Paragraph>
        </div>
        <div class='w-100 w-50-ns ml4-ns'>
          <Paragraph class='i mt0 mb2' id='terms-unique-user'>
            {__('Unique user')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('You are defined as a unique user after your opt-in to data collection. To measure this, a <a href="#terms-cookies" class="%s">cookie</a> is used to assign a user <a href="#terms-id" class="%s">ID</a> to you.', 'b link dim dark-green', 'b link dim dark-green')}
          </Paragraph>
          <Paragraph class='i mt0 mb2' id='terms-unique-session'>
            {__('Unique session')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('A unique session is defined as a <a href="#terms-unique-user" class="%s">unique user</a> being actively engaged with a page during a browser session. To measure this, a <a href="#terms-cookies" class="%s">cookie</a> is used to assign a session <a href="#terms-id" class="%s">ID</a> to you.', 'b link dim dark-green', 'b link dim dark-green', 'b link dim dark-green')}
          </Paragraph>
          <Paragraph class='i mt0 mb2' id='terms-id'>
            {__('ID')}
          </Paragraph>
          <Paragraph class='mt0 mb4'>
            {__('Originally: UUID. Full form: Universally unique identifier. Offen uses UUID of version 4. These IDs are generated randomly, unique and without using any personal data. On the individual Offen server, they are handled in an unrecognizable form. <a href="https://en.wikipedia.org/wiki/Universally_unique_identifier" class="%s" target="_blank" rel="noreferer noopener">Learn more.</a>', 'b link dim dark-green')}
          </Paragraph>
        </div>
      </div>
    </div>
  )
}
