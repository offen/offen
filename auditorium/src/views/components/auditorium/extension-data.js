/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const { Link, Container } = require('./../_shared/link-list')

const InstallInstructions = (props) => {
  return (
    <div class='flex flex-column flex-row-ns items-center pb4'>
      <div class='w-100 w-60-ns mr3-ns mb3 mb0-ns'>
        <h3 class='f5 tl normal mt0 mb0'>
          {__('Add our browser extension to have instant access to your usage data from other Offen Fair Web Analytics installations you have visited.')}
        </h3>
      </div>
      <div class='w-100 w-40-ns link dim tc'>
        <a href='https://docs.offen.dev/' target='_blank' rel='noreferrer noopener' class='w-100 w-auto-ns f5 tc no-underline bn ph3 pv2 dib br1 white bg-mid-gray'>
          {__('Add browser extension')}
        </a>
      </div>
    </div>
  )
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
            <Container>
              {extensionData.installs.map((origin, idx) => {
                const u = new window.URL(origin)
                u.pathname = '/auditorium'
                return (
                  <Link
                    key={`install-${origin}`}
                    isActive={u.host === window.location.host}
                    href={u.toString()}
                  >
                    {u.host}
                  </Link>
                )
              })}
            </Container>
          )
        })()}
      </div>
    </div>

  )
}
