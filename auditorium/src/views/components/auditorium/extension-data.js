/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const InstallInstructions = (props) => {
  return <p>{__("Here's how to install things.")}</p>
}

module.exports = (props) => {
  return (
    <div class='bg-black-05 flex-auto pa3'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Instant access')}
      </h4>
      <div class='flex flex-column flex-wrap-m flex-row-ns'>
        {(() => {
          const { extensionData } = props
          if (!extensionData) {
            return <InstallInstructions />
          }
          return (
            <ul class='flex flex-wrap list pl0 ma0 b--moon-gray'>
              {extensionData.installs.map((install, idx) => {
                return (
                  <li
                    class='link dim dib br1 ph3 pv2 mb2 mr2 white bg-mid-gray'
                    key={install + idx}
                  >
                    {install}
                  </li>
                )
              })}
            </ul>
          )
        })()}
      </div>
    </div>

  )
}
