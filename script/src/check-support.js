module.exports = checkSupport

// checkSupport ensures all features the application assumes present are
// supported by the browser that is running the script and that "Do Not Track"
// is not enabled. It is important that this does use a callback interface
// as it native Promises might not necessarily be supported.
function checkSupport (callback) {
  var err = null

  if (!isSecureContext()) {
    err = new Error(__('The host page is required to run in a secure context'))
  }
  if (!err && !supportsWebCrypto()) {
    err = new Error(__('Browser does not support WebCrypto which is required'))
  }
  if (!err && !supportsIndexedDb()) {
    err = new Error(__('Browser does not support IndexedDB which is required'))
  }
  if (!err && !supportsFetch()) {
    err = new Error(__('Browser does not support window.fetch which is required'))
  }
  if (!err && !supportsURL()) {
    err = new Error(__('Browser does not support window.URL which is required'))
  }
  setTimeout(function () {
    callback(err)
  }, 0)
}

function isSecureContext () {
  return window.location.hostname === 'localhost' || window.location.protocol === 'https:' || window.location.protocol === 'file:'
}

function supportsWebCrypto () {
  return window.crypto && window.crypto.subtle
}

function supportsIndexedDb () {
  return typeof window.indexedDB === 'object'
}

function supportsFetch () {
  return typeof window.fetch === 'function'
}

function supportsURL () {
  return typeof window.URL === 'function'
}
