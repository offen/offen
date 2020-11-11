/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Collapsible = require('./../_shared/collapsible')
const classnames = require('classnames')

const GoSettings = (props) => {
  return (
    <div class='flex-auto bg-black-05'>
      <Collapsible
        header={(props) => {
          const { isCollapsed, handleToggle } = props
          return (
            <div
              data-testid='auditorium/console-headline'
              class='flex justify-between pointer pa3'
              onclick={handleToggle}
              onkeypress={(e) => {
                if (e.which === 13) {
                  handleToggle()
                }
              }}
              tabindex='0'
              role='button'
            >
              <h4 class='f4 normal ma0'>
                {__('Admin console')}
              </h4>
              <a
                aria-label={__('Toggle display of Admin console navigation')}
                class={classnames('dib', 'label-toggle', isCollapsed ? 'label-toggle--rotate' : null)}
              />
            </div>
          )
        }}
        body={(props) => {
          return (
            <div class='mw6 center ph3 mt3 mb4'>
              <p class='ma0 mb3'>
                {__('Share all accounts, create a new one, change your email address and password, log out from Offen')}
              </p>
              <div class='link dim'>
                <a
                  href='/console/'
                  data-testid='auditorium/console-link'
                  class='w-100 w-auto-ns f5 tc no-underline bn dib br1 ph3 pv2 mr0 mr2-ns mb3 white bg-mid-gray'
                >
                  {__('Open admin console')}
                </a>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}

module.exports = GoSettings
