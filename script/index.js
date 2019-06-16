var checkSupport = require('./src/check-support')
var bootstrap = require('./src/bootstrap')

// this needs to be called on module level as otherwise the value will be undefined
// again
var accountId = document.currentScript && document.currentScript.dataset.accountId

checkSupport(function (err) {
  if (err) {
    console.log('"offen" does not support this site, your browser or "Do Not Track" is enabled: ' + err.message)
    console.log('No data will be collected. Find out more at "https://www.offen.dev".')
    return
  }
  bootstrap(process.env.VAULT_HOST, accountId)
    .catch(function (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(err)
      }
    })
})
