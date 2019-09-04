var html = require('choo/html')

module.exports = view

function view (state, emit) {
  var availableAccounts = state.authenticatedUser.accounts
    .slice()
    .sort(function (a, b) {
      return a.accountName.localeCompare(b.name)
    })
    .map(function (account) {
      return html`
        <li>
          <a href="/auditorium/account/${account.accountId}">${account.accountName}</a>
        </li>
      `
    })
  var loggedInMessage = html`
    <p>
      You can access the following accounts:
    </p>
    <ul>
      ${availableAccounts}
    </ul>
  `
  return loggedInMessage
}
