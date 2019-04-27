const ensureUserSecret = require('./src/user-secret')

ensureUserSecret('78403940-ae4f-4aff-a395-1e90f145cf62', 'https://local.offen.org:8080')
  .then(function (userSecret) {
    console.log(userSecret)
  })
  .catch(function (err) {
    console.error(err)
  })
