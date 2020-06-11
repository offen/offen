/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

describe('Public facing assets', function () {
  it('serves the vault', function () {
    cy.visit('/vault/')
  })

  it('serves the script', function () {
    cy.request('/script.js')
  })

  it('serves a health check', function () {
    cy.request('/healthz/')
  })

  it('exposes version information', function () {
    cy.request('/versionz/')
  })
})
