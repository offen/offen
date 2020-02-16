/** @jsx h */
const { h, Fragment } = require('preact')

const KeyMetric = require('./key-metric')
const Tables = require('./tables')

const RowAccountsLive = (props) => {
  const { authenticatedUser, accountId, model } = props
  const availableAccounts = authenticatedUser.accounts
    .slice()
    .sort(function (a, b) {
      return a.accountName.localeCompare(b.accountName)
    })
    .map(function (account, index) {
      var buttonClass = null
      if (account.accountId === accountId) {
        buttonClass = 'b link dim dib bt bw2 b--mid-gray pv2 mb2 mr3 mid-gray'
      } else {
        buttonClass = 'link dim dib pv2 mt1 mb2 mr3 mid-gray'
      }
      return (
        <li
          key={index}
          class='pr1 bt b--moon-gray'
        >
          <a href={`/auditorium/${account.accountId}/`} class={buttonClass}>
            {account.accountName}
          </a>
        </li>
      )
    })
  const accounts = (
    <Fragment>
      <div class='flex justify-between'>
        <h4 class='f4 normal mt0 mb3'>
          {__('Choose account')}
        </h4>
        <a role='button' class='dib dn-ns label-toggle label-toggle--rotate' />
      </div>
      <ul class='flex flex-wrap list pa0 ma0 mb3 grow-list b--moon-gray'>
        {availableAccounts}
      </ul>
    </Fragment>
  )

  const live = (
    <div class='flex flex-column flex-row-ns'>
      <div class='w-100 w-30-ns bn br-ns b--light-gray pr2 mr4'>
        <h4 class='f4 normal ma0 mb4'>
          {__('Real time')}
        </h4>
        <KeyMetric
          value={model.result.liveUsers}
          name={__('Active users on site')}
          formatAs='count'
        />
      </div>
      <div class='w-100 w-70-ns bt bn-ns b--light-gray mt1'>
        <Tables.Container
          removeBorder
        >
          <Tables.Table
            headline={__('Active pages')}
            columnNames={[__('URL'), __('Visitors')]}
            rows={model.result.livePages}
          />
        </Tables.Container>
      </div>
    </div>
  )

  return (
    <div class='flex flex-column flex-row-l mt4'>
      <div class='w-100 w-30-l br0 br2-ns pa3 mb2 mr2-ns bg-black-05'>
        {accounts}
      </div>
      <div class='w-100 w-70-l bt ba-ns b--black-10 br0 br2-ns pa3 mb2-ns bg-white'>
        {live}
      </div>
    </div>
  )
}

module.exports = RowAccountsLive
