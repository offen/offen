var handleFetchResponse = require('offen/fetch-response')

module.exports = getAccount

function getAccount (accountId) {
  var url = new window.URL(`${process.env.SERVER_HOST}/accounts`)
  url.search = new window.URLSearchParams({ account_id: accountId })
  return window
    .fetch(url, {
      method: 'GET',
      credentials: 'include'
    })
    .then(handleFetchResponse)
}
