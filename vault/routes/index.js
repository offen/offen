const express = require('express')
const router = express.Router()

router.get('/', function (req, res, next) { // eslint-disable-line no-unused-vars
  res.render('index', { title: 'Offen' })
})

module.exports = router
