/** @jsx h */
const { h } = require('preact')

const Header = (props) => {
  const { isOperator, accountName } = props
  let copy = null
  if (isOperator) {
    copy = __(
      'You are viewing data as <strong>operator</strong> with account <strong>%s</strong>.',
      accountName
    )
  } else {
    copy = __('You are viewing your <strong>usage data.</strong>')
  }
  return (
    <p
      class='dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow'
      dangerouslySetInnerHTML={{ __html: copy }}
    />
  )
}

module.exports = Header
