/** @jsx h */
const { h } = require('preact')

const withTitle = require('./components/hoc/with-title')

const NotFoundView = () => (
  <p class='dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow'>
    {__('Not found...')}
  </p>
)

module.exports = withTitle('Not Found | Offen')(NotFoundView)
