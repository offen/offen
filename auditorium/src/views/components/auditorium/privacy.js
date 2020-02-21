/** @jsx h */
const { h, Fragment } = require('preact')

const Privacy = (props) => {
  const { userHasOptedIn } = props

  function handleConsent () {
    const nextStatus = userHasOptedIn ? 'deny' : 'allow'
    props.onConsent(nextStatus)
  }

  function handlePurge () {
    props.onPurge()
  }

  let deleteButton = null
  if (userHasOptedIn) {
    deleteButton = (
      <Fragment>
        <p
          class='ma0 mb3'
          dangerouslySetInnerHTML={{
            __html: __('Stay opted in, only delete <strong>usage data</strong>')
          }}
        />
        <button
          class='pointer w-100 w-auto-ns f5 link dim bn dib br1 ph3 pv2 mr1 mb4 white bg-mid-gray'
          data-role='purge'
          onclick={handlePurge}
        >
          {__('Delete')}
        </button>
      </Fragment>
    )
  }

  return (
    <div class='pa3 bg-black-05 flex-auto'>
      <div class='flex flex-column flex-row-ns'>
        <div class='w-100 w-auto-m w-40-l bn br-ns b--moon-gray mb0-ns pr0 pr4-ns mr0 mr4-ns'>
          <h4 class='f4 normal mt0 mb3'>
            {__('Privacy')}
          </h4>
          <p
            class='ma0 mb3'
            dangerouslySetInnerHTML={{
              __html: userHasOptedIn
                ? __('Opt out and delete <strong>usage data</strong>')
                : __('Opt in and grant access to your <strong>usage data</strong>')
            }}
          />
          <button
            class='pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 dib br1 mb4 white bg-mid-gray'
            data-role='consent'
            onclick={handleConsent}
          >
            {userHasOptedIn ? __('Opt out') : __('Opt in')}
          </button>
        </div>
        <div class='w-100 w-auto-m w-60-l bt bn-ns b--moon-gray pt3 pt4-ns mt2'>
          {deleteButton}
        </div>
      </div>
    </div>
  )
}

module.exports = Privacy
