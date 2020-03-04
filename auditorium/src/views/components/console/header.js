/** @jsx h */
const { h } = require('preact')

const HighlightBox = require('./../_shared/highlight-box')

const Header = (props) => {
  return (
    <HighlightBox
      dangerouslySetInnerHTML={{
        __html: __(
          'You are logged in as <strong>operator</strong>.'
        )
      }}
    />
  )
}

module.exports = Header
