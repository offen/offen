/** @jsx h */
const { h, Fragment } = require('preact')

const AccountPicker = (props) => {
  const availableAccounts = props.accounts
    .slice()
    .sort(function (a, b) {
      return a.accountName.localeCompare(b.accountName)
    })
    .map(function (account, idx) {
      return (
        <li class='bt b--moon-gray' key={idx}>
          <a href={`/auditorium/${account.accountId}/`} class='link dim dib pv2 mt1 mb2 mr3 mid-gray'>
            {account.accountName}
          </a>
        </li>
      )
    })

  return (
    <Fragment>
      <p
        dangerouslySetInnerHTML={{ __html: __('You are logged in as <strong>operator.</strong>') }}
        class='dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow'
      />
      <div class='w-100 pa3 mt4 mb2 br0 br2-ns bg-black-05'>
        <h4 class='f4 normal mt0 mb3'>
          {__('Open account')}
        </h4>
        <ul class='flex flex-wrap list pl0 mt0 mb3'>
          {availableAccounts}
        </ul>
      </div>
    </Fragment>
  )
}

module.exports = AccountPicker
