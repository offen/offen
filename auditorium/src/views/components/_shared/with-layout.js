/** @jsx h */
const { h, Fragment } = require('preact')
const { connect } = require('react-redux')

const HighlightBox = require('./highlight-box')
const flash = require('./../../../action-creators/flash')

const Layout = (props) => (
  <div class='f5 roboto dark-gray'>
    <div class='w-100 h3 bg-black-05'>
      <div class='mw8 center flex ph3 pt2' id='headline'>
        <a href='/' class='dim'>
          <img src='/offen-icon-black.svg' alt='Offen logo' width='37' height='40' class='ma0 mt1 mr3' />
        </a>
        <h1 class='f2 normal ma0 mt1'>{props.headline || __('Offen Auditorium')}</h1>
      </div>
    </div>
    <div class='mw8 center ph0 ph3-ns pb4'>
      {props.error
        ? (
          <Fragment>
            <HighlightBox>
              {__('An error occured: %s', props.error.message)}
            </HighlightBox>
            <pre>{props.error.stack}</pre>
          </Fragment>
        )
        : props.children}
    </div>
    <div class='mw8 center flex flex-column flex-row-ns justify-between ph3 pb5 moon-gray'>
      <div>
        <p class='b ma0 mb1'>
        Offen
        </p>
        <p class='ma0 mb2' dangerouslySetInnerHTML={{ __html: __('Transparent web analytics<br>for everyone') }} />
      </div>
      <div>
        <a href='https://www.offen.dev/' class='normal link dim moon-gray' target='_blank' rel='noopener noreferrer'>
        www.offen.dev
        </a>
      </div>
    </div>
    {props.flash.length
      ? (
        <div class='fixed bottom-0 bottom-2-ns w-100 ph4-ns'>
          {props.flash.map((message) => (
            <p
              key={message.id}
              class='pointer mw6 mv0 mt3-ns center ph3 pv4 bg-light-yellow shadow-1-ns b--black-10 bt bn-ns flex items-center'
              onclick={() => props.handleExpire(message.id)}
            >
              <img src='/offen-icon-black.svg' alt='Offen logo' height='30' class='ma0 mr3' />
              <span
                dangerouslySetInnerHTML={{ __html: message.content }}
              />
            </p>
          ))}
        </div>
      ) : null}
  </div>
)

const withLayout = () => (OriginalComponent) => {
  const WrappedComponent = (props) => {
    const { error, flash, handleExpire, ...otherProps } = props
    return (
      <Layout error={error} flash={flash} handleExpire={handleExpire}>
        <OriginalComponent {...otherProps} />
      </Layout>
    )
  }

  const mapStateToProps = (state) => ({
    error: state.globalError,
    flash: state.flash
  })

  const mapDispatchToProps = {
    handleExpire: flash.expire
  }

  return connect(mapStateToProps, mapDispatchToProps)(WrappedComponent)
}

module.exports = withLayout
