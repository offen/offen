/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const OperatorLogin = (props) => {
  return (
    <div class='flex flex-column flex-row-ns items-center ph3 ph4-ns pv4 bg-black-05'>
      <div class='w-100 w-60-ns mr3-ns mb3 mb0-ns'>
        <h3 class='f5 tc tl-ns normal mt0 mb0'>
          {__('Are you the operator of this Offen installation? Log in to your account.')}
        </h3>
      </div>
      <div class='w-100 w-40-ns tc'>
        <a href='/login/' class='f5 tc link dim bn ph3 pv2 dib br1 white bg-mid-gray'>
          {__('Log in as operator')}
        </a>
      </div>
    </div>
  )
}

module.exports = OperatorLogin
