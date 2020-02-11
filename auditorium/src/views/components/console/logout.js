/** @jsx h */
const { h } = require('preact')

const Logout = (props) => {
  function handleClick () {
    props.onLogout(
      __('You have been logged out.'),
      __('There was an error terminating your session, please try again.')
    )
  }

  return (
    <div class='w-100 pa3 mb2 br0 br2-ns bg-black-05'>
      <h4 class='f5 normal mt0 mb3'>
        {__('Logout')}
      </h4>
      <button
        onclick={handleClick}
        class='pointer f5 link dim bn ph3 pv2 mr2 mb1 dib br1 white bg-mid-gray'
      >
        {__('Logout')}
      </button>
    </div>
  )
}

module.exports = Logout
