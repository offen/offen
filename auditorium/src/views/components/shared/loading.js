/** @jsx h */
const { h } = require('preact')

module.exports = (props) => (
  <p class='dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow'>
    {props.children}
  </p>
)
