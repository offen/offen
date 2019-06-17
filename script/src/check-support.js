module.exports = checkSupport

// checkSupport ensures all features the application assumes present are
// supported by the browser that is running the script and that "Do Not Track"
// is not enabled. It is important that this does use a callback interface
// as it native Promises might not necessarily be supported.
function checkSupport (callback) {
  var err = null

  if (!isSecureContext()) {
    err = new Error('The host page is required to run in a secure context')
  }
  if (!err && !allowsTracking()) {
    err = new Error('Browser has "Do Not Track" setting enabled')
  }
  if (!err && !supportsWebCrypto()) {
    err = new Error('Browser does not support WebCrypto which is required')
  }
  if (!err && !supportsIndexedDb()) {
    err = new Error('Browser does not support IndexedDB which is required')
  }
  if (!err && !supportsFetch()) {
    err = new Error('Browser does not support window.fetch which is required')
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

function allowsTracking () {
  // TODO: ideally, the CDN serving this script would already drop the request
  // requesting this script, but it's probably good to keep this in here anyways
  return !navigator.doNotTrack
}
