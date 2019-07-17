var html = require('choo/html')

module.exports = view

function view (state, emit) {
  var availableAccounts = state.authenticatedUser.accounts.map(function (account) {
    return html`
      <li>
        <a href="/account/${account.accountId}">${account.name}</a>
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
