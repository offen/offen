/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')

const Logout = (props) => {
  const [isDisabled, setIsDisabled] = useState(false)
  function handleClick () {
    setIsDisabled(true)
    props.onLogout(
      __('You have been logged out.'),
      __('There was an error terminating your session, please try again.')
    )
      .then(() => setIsDisabled(false))
  }
  return (
    <div class='bg-black-05 pa3'>
      <div class='mw6 center mb4'>
        <div class='w-100 w-auto-ns tr-ns mt3'>
          <button
            class='pointer w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 white bg-silver'
            onclick={handleClick}
            disabled={isDisabled}
          >
            {__('Logout')}
          </button>
        </div>
      </div>
    </div>
  )
}

module.exports = Logout
