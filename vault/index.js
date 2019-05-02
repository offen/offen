const ensureUserSecret = require('./src/user-secret')

ensureUserSecret('9b63c4d8-65c0-438c-9d30-cc4b01173393', 'https://local.offen.dev:8080')
  .then(function (userSecret) {
    console.log(userSecret)
  })
  .catch(function (err) {
    console.error(err)
  })
