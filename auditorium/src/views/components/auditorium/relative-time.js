/** @jsx h */
const { h, Fragment } = require('preact')

const RelativeTime = (props) => {
  var display = null
  if (props.children === 0) {
    display = __('This week')
  } else {
    display = __('%d days earlier', props.children * 7)
  }
  return (
    <Fragment>
      {display}
    </Fragment>
  )
}

module.exports = RelativeTime
