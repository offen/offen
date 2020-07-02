/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

describe('Operator', function () {
  context('Login / Logout', function () {
    it('allows login using valid credentials', function () {
      cy.visit('/login/')
      cy.get('[data-testid="login/username-input"]').type(Cypress.env('OPERATOR_USERNAME'))
      cy.get('[data-testid="login/password-input"]').type(Cypress.env('OPERATOR_PASSWORD'))
      cy.get('[data-testid="login/form"]').submit()
      cy.url().should('not.include', '/login/')
      cy.url().should('include', '/auditorium/')

      cy.get('[data-testid="auditorium/console-headline"]').click()
      cy.get('[data-testid="auditorium/console-link"]').click()
      cy.url().should('include', '/console/')

      cy.contains('Logout').click()
      cy.url().should('include', '/login/')

      cy.visit('/console/')
      cy.url().should('include', '/login/')
    })

    it('does not allow login using invalid credentials', function () {
      cy.visit('/login/')
      cy.get('[data-testid="login/username-input"]').type('not@invented.here')
      cy.get('[data-testid="login/password-input"]').type('foobarbaz')
      cy.get('[data-testid="login/form"]').submit()
      cy.url().should('not.include', '/auditorium/')
      cy.url().should('include', '/login/')
    })

    it('does not allow login using an invalid password', function () {
      cy.visit('/login/')
      cy.get('[data-testid="login/username-input"]').type(Cypress.env('OPERATOR_USERNAME'))
      cy.get('[data-testid="login/password-input"]').type('nottherealpassword')
      cy.get('[data-testid="login/form"]').submit()
      cy.url().should('not.include', '/auditorium/')
      cy.url().should('include', '/login/')

      cy.get('[data-testid="login/password-input"]').type('anothertry')
      cy.get('[data-testid="login/form"]').submit()
      cy.url().should('not.include', '/auditorium/')
      cy.url().should('include', '/login/')

      cy.get('[data-testid="login/password-input"]').type('yetanothertry')
      cy.get('[data-testid="login/form"]').submit()
      cy.url().should('not.include', '/auditorium/')
      cy.url().should('include', '/login/')
    })

    it('redirects unauthenticated users to the login', function () {
      cy.visit('/console/')
      cy.url().should('include', '/login/')
    })
  })
})
