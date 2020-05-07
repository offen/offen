describe('Public routes', () => {
  it('Index page loads', () => {
    cy.visit('/')
  })
  it('Auditorium loads', () => {
    cy.visit('/auditorium/')
  })
  it('Vault loads', () => {
    cy.visit('/vault/')
  })
  it('Script loads', () => {
    cy.request('/script.js')
  })
  it('Health Check loads', () => {
    cy.request('/healthz')
  })
  it('Version Check loads', () => {
    cy.request('/versionz')
  })
})
