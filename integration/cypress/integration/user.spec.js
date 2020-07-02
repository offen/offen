/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

describe('User', function () {
  context('Index Page', function () {
    it('displays informations for users', function () {
      cy.visit('/')
      cy.get('[data-testid="index/faq"]').should('exist')
      cy.get('[data-testid="index/operator-login"]').should('exist')
      cy.get('[data-testid="index/consent-banner"]').should('exist')
    })

    it('allows users to opt in and visit the auditorium', function () {
      cy.visit('/')

      // Both buttons should be active. In this test, we decide to opt in
      cy.get('[data-testid="index/consent-opt-out"]').should('not.be', 'disabled')
      cy.get('[data-testid="index/consent-opt-in"]').click()

      // Opting in should replace the buttons with a link to the Auditorium
      cy.get('[data-testid="index/consent-opt-in"]').should('not', 'exist')
      cy.get('[data-testid="index/consent-opt-out"]').should('not', 'exist')
      cy.get('[data-testid="index/open-auditorium"]').click()

      // The user sees a user-specific auditorium
      cy.url().should('include', '/auditorium/')
      cy.get('[data-testid="auditorium/basic-terms"]').should('exist')
      cy.get('[data-testid="auditorium/faq"]').should('exist')
    })

    it('allows users to opt out', function () {
      cy.visit('/')

      // Both buttons should be active. In this test, we decide to opt out
      cy.get('[data-testid="index/consent-opt-in"]').should('not.be', 'disabled')
      cy.get('[data-testid="index/consent-opt-out"]').click()

      cy.get('[data-testid="index/open-auditorium"]').should('not', 'exist')
      cy.get('[data-testid="index/consent-opt-in"]').should('not.be', 'disabled')
      cy.get('[data-testid="index/consent-opt-out"]').should('be', 'disabled')
    })
  })
})
