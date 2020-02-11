/** @jsx h */
const { h } = require('preact')

const GoSettings = (props) => {
  return (
    <div class='w-100 w-100-ns br0 br2-ns pa3 mt2 bg-black-05'>
      <div class='flex justify-between'>
        <h4 class='f4 normal mt0 mb3'>
          {__('Admin console')}
        </h4>
        <a role='button' class='dib label-toggle label-toggle--rotate' />
      </div>
      <div class='mw6 center mb4'>
        <p class='ma0 mb3'>
          {__('Share all accounts, create a new one, change your email address and password, log out from Offen')}
        </p>
        <a href='/console/' class='w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mr0 mr2-ns mb3 mb0-ns white bg-mid-gray'>
          {__('Open admin console')}
        </a>
      </div>
    </div>
  )
}

module.exports = GoSettings
