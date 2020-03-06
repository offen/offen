/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const AccountPicker = require('./../_shared/account-picker')

module.exports = (props) => {
  return (
    <AccountPicker
      headline={__('Open account')}
      {...props}
    />
  )
}
