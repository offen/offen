/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const Paragraph = require('./../_shared/paragraph')

const UserAuditorium = (props) => {
  return (
    <div class='ph3 ph4-ns pv4 bg-black-05'>
      <h3 class='f5 normal mt0 mb0'>
        <Paragraph class='mt0 mb1'>
          {__('Not the operator of this installation? Manage your data in the <a href="/auditorium/" class="%s" >User Auditorium.</a>', 'b link dim dark-green')}
        </Paragraph>
      </h3>
    </div>
  )
}

module.exports = UserAuditorium
