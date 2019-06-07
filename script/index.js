var checkSupport = require('./src/check-support')
var bootstrap = require('./src/bootstrap')

var accountId = document.currentScript && document.currentScript.dataset.accountId

checkSupport(function (err) {
  if (err) {
    console.log('"offen" does not support this browser or "Do Not Track" is enabled. No data will be collected. Find out more at https://www.offen.dev.')
    return
  }
  bootstrap(process.env.VAULT_HOST, accountId)
    .catch(function (err) {
      console.error(err)
    })
})
