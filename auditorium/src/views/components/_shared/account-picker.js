/** @jsx h */
const { h } = require('preact')

const AccountPicker = (props) => {
  const { accounts, selectedId, headline } = props

  const availableAccounts = accounts
    .slice()
    .sort(function (a, b) {
      return a.accountName.localeCompare(b.accountName)
    })
    .map(function (account, idx) {
      let buttonClass = 'link dim dib pv2 mt1 mb2 mr3 mid-gray'
      if (account.accountId === selectedId) {
        buttonClass = 'b link dim dib bt bw2 b--mid-gray pv2 mb2 mr3 mid-gray'
      }

      return (
        <li class='bt b--moon-gray' key={idx}>
          <a href={`/auditorium/${account.accountId}/`} class={buttonClass}>
            {account.accountName}
          </a>
        </li>
      )
    })

  return (
    <div class='flex-auto bg-black-05 pa3'>
      <h4
        class='f4 normal mt0 mb3'
        dangerouslySetInnerHTML={{
          __html: headline
        }}
      />
      <ul class='flex flex-wrap list pl0 mt0 mb3 grow-list b--moon-gray'>
        {availableAccounts}
      </ul>
    </div>
  )
}

module.exports = AccountPicker
