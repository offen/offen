/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const { Link, Container } = require('./../_shared/link-list')

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
