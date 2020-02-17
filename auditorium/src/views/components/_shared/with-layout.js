/** @jsx h */
const { h, Fragment } = require('preact')
const { connect } = require('react-redux')

const HighlightBox = require('./highlight-box')

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
      {props.flash
        ? (
          <p class='dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow'>
            {props.flash}
          </p>
        ) : null}
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
        <a href='https://www.offen.dev/' class='normal link underline dim moon-gray' target='_blank' rel='noopener noreferrer'>
          www.offen.dev
        </a>
      </div>
    </div>
  </div>
)

const withLayout = () => (OriginalComponent) => {
  const WrappedComponent = (props) => {
    const { error, flash, ...otherProps } = props
    return (
      <Layout error={error} flash={flash}>
        <OriginalComponent {...otherProps} />
      </Layout>
    )
  }

  const mapStateToProps = (state) => ({
    error: state.globalError,
    flash: state.flash
  })

  return connect(mapStateToProps)(WrappedComponent)
}

module.exports = withLayout
