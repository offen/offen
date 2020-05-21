describe('Lighthouse Audits', function () {
  context('The index page', function () {
    it('passes the lighthouse audits', function () {
      if (!Cypress.env('RUN_LIGHTHOUSE_AUDIT')) {
        this.skip()
      }
      cy.visit('/')
      cy.lighthouse()
    })
  })
  context('The auditorium', function () {
    it('passes the lighthouse audits', function () {
      if (!Cypress.env('RUN_LIGHTHOUSE_AUDIT')) {
        this.skip()
      }
      cy.visit('/auditorium')
      cy.lighthouse()
    })
  })
  context('The login page', function () {
    it('passes the lighthouse audits', function () {
      if (!Cypress.env('RUN_LIGHTHOUSE_AUDIT')) {
        this.skip()
      }
      cy.visit('/login')
      cy.lighthouse()
    })
  })
  context('The admin console', function () {
    it('passes the lighthouse audits', function () {
      if (!Cypress.env('RUN_LIGHTHOUSE_AUDIT')) {
        this.skip()
      }
      cy.login()
      cy.visit('/console')
      cy.lighthouse()
    })
  })
  context('The reset password form', function () {
    it('passes the lighthouse audits', function () {
      if (!Cypress.env('RUN_LIGHTHOUSE_AUDIT')) {
        this.skip()
      }
      cy.visit('/reset-password/xyz')
      cy.lighthouse()
    })
  })
  context('The forgot password form', function () {
    it('passes the lighthouse audits', function () {
      if (!Cypress.env('RUN_LIGHTHOUSE_AUDIT')) {
        this.skip()
      }
      cy.visit('/forgot-password/xyz')
      cy.lighthouse()
    })
  })
})
