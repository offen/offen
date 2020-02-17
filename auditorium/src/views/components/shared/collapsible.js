/** @jsx h */
const { h, Fragment } = require('preact')
const { useState } = require('preact/hooks')

const Collapsible = (props) => {
  const { headline, body, initAsCollapsed = true } = props
  const [isCollapsed, setIsCollapsed] = useState(initAsCollapsed)

  const headlineContent = headline({ isCollapsed: isCollapsed })
  headlineContent.props.onclick = () => setIsCollapsed(!isCollapsed)
  const bodyContent = isCollapsed ? null : body({})

  return (
    <Fragment>
      {headlineContent}
      {bodyContent}
    </Fragment>
  )
}

module.exports = Collapsible
