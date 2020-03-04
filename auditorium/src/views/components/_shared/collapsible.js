/** @jsx h */
const { h, Fragment } = require('preact')
const { useState } = require('preact/hooks')

const Collapsible = (props) => {
  const { header, body, initAsCollapsed = true } = props
  const [isCollapsed, setIsCollapsed] = useState(initAsCollapsed)

  const headerContent = header({
    handleToggle: () => setIsCollapsed(!isCollapsed),
    isCollapsed: isCollapsed
  })

  return (
    <Fragment>
      {headerContent}
      {isCollapsed ? null : body({})}
    </Fragment>
  )
}

module.exports = Collapsible
