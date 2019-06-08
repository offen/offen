var handleFetchResponse = require('offen/fetch-response')

module.exports = getAccountWith(`${process.env.SERVER_HOST}/accounts`)
module.exports.getAccountWith = getAccountWith

function getAccountWith (accountsUrl) {
  return function (accountId) {
    var url = new window.URL(accountsUrl)
    url.search = new window.URLSearchParams({ account_id: accountId })
    return window
      .fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      .then(handleFetchResponse)
  }
}
